/**
 * AI Processing Service
 * Handles integration with Google Cloud Run services for AI content processing
 */

import { supabase } from '@/integrations/supabase/client';

// Cloud Run service endpoints (can be moved to environment variables)
const SERVICES = {
  preprocessor: 'https://gemeos-preprocessor-yobx5quxgq-ew.a.run.app',
  conceptChunker: 'https://gemeos-concept-chunker-yobx5quxgq-ew.a.run.app',
  conceptStructurer: 'https://gemeos-concept-structurer-yobx5quxgq-ew.a.run.app',
  learningGoalGenerator: 'https://gemeos-learning-goal-generator-yobx5quxgq-ew.a.run.app'
};

// Temporary upload bucket for frontend uploads
const TEMP_UPLOAD_BUCKET = 'gemeos-uploads-temp';

export interface FileUploadRequest {
  file: File;
  domainSlug: string;
  contentType: 'concept' | 'learning_goal' | 'exercise';
  userId: string;
}

export interface ProcessingStatus {
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  conceptsFound?: number;
  learningGoalsGenerated?: number;
  exercisesGenerated?: number;
}

export interface DomainFile {
  id: string;
  domain_id: string;
  file_name: string;
  file_path: string;
  status: string;
  content_type: string;
  created_at: string;
  extracted_text?: string;
  metadata_json?: any;
}

/**
 * Upload file to temporary GCS bucket via Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  domainSlug: string,
  userId: string
): Promise<{ bucket: string; path: string }> {
  try {
    // Generate unique path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `${domainSlug}/${userId}/${timestamp}_${file.name}`;
    
    // Upload to Supabase storage (which can be configured to use GCS)
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      bucket: 'uploads',
      path: data.path
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Trigger preprocessing for uploaded file
 */
export async function triggerPreprocessing(
  fileInfo: {
    bucket: string;
    path: string;
    fileName: string;
    domainSlug: string;
    contentType: 'concept' | 'learning_goal' | 'exercise';
    userId: string;
  }
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    const response = await fetch(`${SERVICES.preprocessor}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain_slug: fileInfo.domainSlug,
        content_type: fileInfo.contentType,
        uploaded_by: fileInfo.userId,
        file_name: fileInfo.fileName,
        source_bucket: fileInfo.bucket,
        source_path: fileInfo.path
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        recordId: result.record?.id
      };
    } else {
      return {
        success: false,
        error: result.error || 'Processing failed'
      };
    }
  } catch (error) {
    console.error('Error triggering preprocessing:', error);
    return {
      success: false,
      error: 'Failed to trigger preprocessing'
    };
  }
}

/**
 * Check processing status for a file
 */
export async function checkProcessingStatus(fileId: string): Promise<ProcessingStatus> {
  try {
    // Query domain_extracted_files table for status
    const { data: fileData, error: fileError } = await supabase
      .from('domain_extracted_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    // Count concepts generated from this file
    const { count: conceptCount } = await supabase
      .from('concepts')
      .select('*', { count: 'exact', head: true })
      .eq('source_file_id', fileId);

    // Count learning goals if applicable
    // Note: This assumes learning goals have a source_file_id column
    const { count: goalCount } = await supabase
      .from('learning_goals')
      .select('*', { count: 'exact', head: true })
      .eq('source_file_id', fileId);

    return {
      fileId,
      status: fileData.status,
      progress: fileData.status === 'completed' ? 100 : 
                fileData.status === 'processing' ? 50 : 0,
      message: getStatusMessage(fileData.status),
      conceptsFound: conceptCount || 0,
      learningGoalsGenerated: goalCount || 0,
      exercisesGenerated: 0 // TODO: Add when exercises table has source_file_id
    };
  } catch (error) {
    console.error('Error checking processing status:', error);
    return {
      fileId,
      status: 'failed',
      progress: 0,
      message: 'Failed to check status'
    };
  }
}

/**
 * Get all files for a domain
 */
export async function getDomainFiles(
  domainId: string,
  contentType?: 'concept' | 'learning_goal' | 'exercise'
): Promise<DomainFile[]> {
  try {
    let query = supabase
      .from('domain_extracted_files')
      .select('*')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching domain files:', error);
    return [];
  }
}

/**
 * Get suggested concepts for review
 */
export async function getSuggestedConcepts(domainId: string) {
  try {
    const { data, error } = await supabase
      .from('concepts')
      .select(`
        *,
        domain_extracted_files!source_file_id (
          file_name,
          created_at
        )
      `)
      .eq('domain_id', domainId)
      .eq('status', 'suggested')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching suggested concepts:', error);
    return [];
  }
}

/**
 * Approve suggested concepts
 */
export async function approveConcepts(conceptIds: string[]) {
  try {
    const { error } = await supabase
      .from('concepts')
      .update({ status: 'approved' })
      .in('id', conceptIds);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error approving concepts:', error);
    return { success: false, error };
  }
}

/**
 * Reject suggested concepts
 */
export async function rejectConcepts(conceptIds: string[], reason?: string) {
  try {
    const updates: any = { status: 'rejected' };
    if (reason) {
      updates.metadata = { rejection_reason: reason };
    }

    const { error } = await supabase
      .from('concepts')
      .update(updates)
      .in('id', conceptIds);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error rejecting concepts:', error);
    return { success: false, error };
  }
}

/**
 * Process multiple files in batch
 */
export async function processBatchFiles(
  files: File[],
  domainSlug: string,
  contentTypes: {
    concepts: boolean;
    learningGoals: boolean;
    exercises: boolean;
  },
  userId: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{
  success: boolean;
  processedFiles: string[];
  errors: string[];
}> {
  const processedFiles: string[] = [];
  const errors: string[] = [];
  let totalProgress = 0;
  const progressPerFile = 100 / files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Update progress
      if (onProgress) {
        onProgress(totalProgress, `Uploading ${file.name}...`);
      }

      // Upload file
      const { bucket, path } = await uploadFileToStorage(file, domainSlug, userId);
      
      // Determine primary content type (concepts take priority)
      const contentType = contentTypes.concepts ? 'concept' :
                         contentTypes.learningGoals ? 'learning_goal' : 
                         'exercise';

      // Trigger preprocessing
      const result = await triggerPreprocessing({
        bucket,
        path,
        fileName: file.name,
        domainSlug,
        contentType,
        userId
      });

      if (result.success && result.recordId) {
        processedFiles.push(result.recordId);
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }

      totalProgress += progressPerFile;
      if (onProgress) {
        onProgress(totalProgress, `Processed ${i + 1} of ${files.length} files`);
      }
    } catch (error) {
      errors.push(`${file.name}: ${error}`);
      totalProgress += progressPerFile;
    }
  }

  return {
    success: errors.length === 0,
    processedFiles,
    errors
  };
}

// Helper function to get user-friendly status messages
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'File uploaded, waiting for processing';
    case 'processing':
      return 'AI is analyzing your content';
    case 'completed':
      return 'Processing complete';
    case 'failed':
      return 'Processing failed';
    default:
      return status;
  }
}

/**
 * Poll for processing completion
 */
export async function waitForProcessingCompletion(
  fileIds: string[],
  onProgress?: (status: ProcessingStatus[]) => void,
  maxWaitTime: number = 300000 // 5 minutes
): Promise<ProcessingStatus[]> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    const statuses = await Promise.all(
      fileIds.map(id => checkProcessingStatus(id))
    );
    
    if (onProgress) {
      onProgress(statuses);
    }
    
    // Check if all files are done processing
    const allComplete = statuses.every(
      s => s.status === 'completed' || s.status === 'failed'
    );
    
    if (allComplete) {
      return statuses;
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  // Timeout reached
  throw new Error('Processing timeout reached');
}