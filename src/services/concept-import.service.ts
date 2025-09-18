import { supabase } from '@/integrations/supabase/client';
import { parseCsvFile, validateCsvHeaders } from '@/utils/csv-parser';
import { 
  validateAllConcepts, 
  checkCircularReferences, 
  processConceptRow,
  validateParentReferences,
  separateErrorsAndWarnings 
} from '@/utils/concept-validator';
import type { 
  ConceptImportRow,
  ProcessedConcept,
  ImportResult,
  ImportSession,
  ImportOptions,
  ImportProgressCallback,
  ImportValidationError
} from '@/types/concept-import';

/**
 * Main service for handling CSV concept imports
 */
export class ConceptImportService {
  private domainId: string;
  private userId: string;
  private progressCallback?: ImportProgressCallback;

  constructor(
    domainId: string, 
    userId: string,
    progressCallback?: ImportProgressCallback
  ) {
    this.domainId = domainId;
    this.userId = userId;
    this.progressCallback = progressCallback;
  }

  /**
   * Import concepts from CSV file
   */
  async importFromCsv(
    file: File,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const session = this.createImportSession(file);

    try {
      // Phase 1: Parse CSV
      this.reportProgress(0, 100, 'parsing', 'Parsing CSV file...');
      const { data: rows, errors: parseErrors } = await parseCsvFile(file);
      
      if (parseErrors.length > 0) {
        const { errors } = separateErrorsAndWarnings(parseErrors);
        if (errors.length > 0) {
          return this.createErrorResult(session, parseErrors, startTime);
        }
      }

      if (rows.length === 0) {
        return this.createErrorResult(session, [{
          rowNumber: 0,
          field: 'file',
          error: 'CSV file is empty',
          severity: 'error'
        }], startTime);
      }

      // Check max rows limit
      const maxRows = options.maxRows || 5000;
      if (rows.length > maxRows) {
        return this.createErrorResult(session, [{
          rowNumber: 0,
          field: 'file',
          error: `CSV contains ${rows.length} rows, which exceeds the maximum of ${maxRows}`,
          severity: 'error'
        }], startTime);
      }

      // Phase 2: Validate
      this.reportProgress(25, 100, 'validating', 'Validating concepts...');
      const validationErrors = await this.validateConcepts(rows);
      const { errors, warnings } = separateErrorsAndWarnings(validationErrors);

      if (errors.length > 0) {
        return this.createErrorResult(session, validationErrors, startTime);
      }

      // If dry run, stop here
      if (options.dryRun) {
        return this.createDryRunResult(session, rows.length, warnings, startTime);
      }

      // Check if should skip warnings
      if (warnings.length > 0 && !options.skipWarnings) {
        return this.createWarningResult(session, warnings, startTime);
      }

      // Phase 3: Import
      this.reportProgress(50, 100, 'importing', 'Importing concepts to database...');
      const result = await this.performImport(rows, session);
      
      this.reportProgress(100, 100, 'importing', 'Import completed!');
      
      return {
        ...result,
        summary: {
          ...result.summary,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Import failed:', error);
      return this.createErrorResult(session, [{
        rowNumber: 0,
        field: 'system',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        severity: 'error'
      }], startTime);
    }
  }

  /**
   * Validate concepts including relationships
   */
  private async validateConcepts(rows: ConceptImportRow[]): Promise<ImportValidationError[]> {
    const errors: ImportValidationError[] = [];

    // Basic validation
    errors.push(...validateAllConcepts(rows));

    // Check circular references
    errors.push(...checkCircularReferences(rows));

    // Get existing concepts in domain for parent validation
    const { data: existingConcepts } = await supabase
      .from('concepts')
      .select('name')
      .eq('domain_id', this.domainId);

    const existingNames = existingConcepts?.map(c => c.name) || [];
    
    // Validate parent references
    errors.push(...validateParentReferences(rows, existingNames));

    return errors;
  }

  /**
   * Perform the actual import to database
   */
  private async performImport(
    rows: ConceptImportRow[],
    session: ImportSession
  ): Promise<ImportResult> {
    // Upload CSV to storage first
    const sourceFileId = await this.uploadSourceFile(session.file_name, rows);

    // Process rows into concepts
    const processedConcepts: ProcessedConcept[] = rows.map((row, index) => 
      processConceptRow(
        row,
        this.domainId,
        this.userId,
        `temp_${Date.now()}_${index}`,
        sourceFileId
      )
    );

    // Call edge function for batch import
    const { data, error } = await supabase.functions.invoke('import-concepts-batch', {
      body: {
        concepts: processedConcepts,
        domain_id: this.domainId
      }
    });

    if (error) {
      throw new Error(`Import failed: ${error.message}`);
    }

    return {
      success: true,
      session: {
        ...session,
        status: 'completed',
        completed_at: new Date(),
        processed_rows: data.conceptsCreated?.length || 0
      },
      conceptsCreated: data.conceptsCreated || [],
      conceptsWithWarnings: data.warnings || [],
      summary: {
        totalProcessed: rows.length,
        successCount: data.conceptsCreated?.length || 0,
        errorCount: 0,
        warningCount: data.warnings?.length || 0,
        duration: 0 // Will be set by caller
      }
    };
  }

  /**
   * Upload source CSV to storage
   */
  private async uploadSourceFile(fileName: string, rows: ConceptImportRow[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `domains/${this.domainId}/imports/${timestamp}_${fileName}`;
    
    // Convert rows back to CSV for storage
    const csvContent = this.rowsToCsv(rows);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    const { data, error } = await supabase.storage
      .from('concepts')
      .upload(path, blob);

    if (error) {
      console.warn('Failed to upload source file:', error);
      return '';
    }

    return data.path;
  }

  /**
   * Convert rows back to CSV format
   */
  private rowsToCsv(rows: ConceptImportRow[]): string {
    const headers = ['name', 'parent_concept_name', 'description', 'difficulty_level', 'display_order'];
    const csvRows = [headers.join(',')];
    
    rows.forEach(row => {
      const values = headers.map(h => {
        const value = (row as any)[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Create import session
   */
  private createImportSession(file: File): ImportSession {
    return {
      id: crypto.randomUUID(),
      domain_id: this.domainId,
      file_name: file.name,
      file_size: file.size,
      total_rows: 0,
      processed_rows: 0,
      error_rows: 0,
      warning_count: 0,
      status: 'processing',
      started_at: new Date(),
      imported_by: this.userId
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    session: ImportSession, 
    errors: ImportValidationError[],
    startTime: number
  ): ImportResult {
    return {
      success: false,
      session: {
        ...session,
        status: 'failed',
        error_rows: errors.filter(e => e.severity === 'error').length
      },
      errors,
      summary: {
        totalProcessed: 0,
        successCount: 0,
        errorCount: errors.filter(e => e.severity === 'error').length,
        warningCount: errors.filter(e => e.severity === 'warning').length,
        duration: Date.now() - startTime
      }
    };
  }

  /**
   * Create dry run result
   */
  private createDryRunResult(
    session: ImportSession,
    rowCount: number,
    warnings: ImportValidationError[],
    startTime: number
  ): ImportResult {
    return {
      success: true,
      session: {
        ...session,
        status: 'completed',
        total_rows: rowCount,
        warning_count: warnings.length
      },
      conceptsWithWarnings: warnings.map(w => ({
        conceptId: '',
        warning: `Row ${w.rowNumber}: ${w.error}`
      })),
      summary: {
        totalProcessed: rowCount,
        successCount: rowCount,
        errorCount: 0,
        warningCount: warnings.length,
        duration: Date.now() - startTime
      }
    };
  }

  /**
   * Create warning result
   */
  private createWarningResult(
    session: ImportSession,
    warnings: ImportValidationError[],
    startTime: number
  ): ImportResult {
    return {
      success: false,
      session: {
        ...session,
        status: 'failed',
        warning_count: warnings.length,
        error_message: 'Import cancelled due to warnings. Use "Skip Warnings" option to proceed.'
      },
      errors: warnings,
      summary: {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        warningCount: warnings.length,
        duration: Date.now() - startTime
      }
    };
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    current: number,
    total: number,
    phase: 'parsing' | 'validating' | 'importing',
    message?: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({ current, total, phase, message });
    }
  }
}