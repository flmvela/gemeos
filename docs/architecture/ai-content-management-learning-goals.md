# AI Content Management System - Learning Goals Extension
## Architecture Design Document

### Table of Contents
1. [Extended Data Model](#1-extended-data-model)
2. [Processing Pipeline](#2-processing-pipeline)
3. [Bloom's Taxonomy Integration](#3-blooms-taxonomy-integration)
4. [Learning Goal Sequencing Algorithm](#4-learning-goal-sequencing-algorithm)
5. [Dependency Management](#5-dependency-management)
6. [UI/UX Flow](#6-uiux-flow)
7. [Review Workflow](#7-review-workflow)
8. [API Endpoints](#8-api-endpoints)
9. [Validation Rules](#9-validation-rules)
10. [AI Processing Prompts](#10-ai-processing-prompts)

---

## 1. Extended Data Model

### Core Entities

```sql
-- Learning Goals Processing Queue
CREATE TABLE learning_goal_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    batch_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('concept_generation', 'upload_refinement')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    
    INDEX idx_lg_queue_batch (batch_id),
    INDEX idx_lg_queue_status (status, created_at)
);

-- Learning Goal Items (Individual Goals)
CREATE TABLE learning_goal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES learning_goal_processing_queue(id),
    external_id VARCHAR(255), -- For uploaded goals
    title TEXT NOT NULL,
    description TEXT,
    original_title TEXT, -- Pre-refinement title
    original_description TEXT, -- Pre-refinement description
    bloom_level VARCHAR(50) CHECK (bloom_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
    sequence_order INTEGER,
    processing_status VARCHAR(50) DEFAULT 'pending',
    ai_suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_lg_items_queue (queue_id),
    INDEX idx_lg_items_status (processing_status)
);

-- Learning Goal Concept Associations
CREATE TABLE learning_goal_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_goal_id UUID NOT NULL REFERENCES learning_goal_items(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    association_type VARCHAR(50) DEFAULT 'primary', -- primary, supporting, prerequisite
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(learning_goal_id, concept_id),
    INDEX idx_lg_concepts_goal (learning_goal_id),
    INDEX idx_lg_concepts_concept (concept_id)
);

-- Learning Goal Relationships
CREATE TABLE learning_goal_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_goal_id UUID NOT NULL REFERENCES learning_goal_items(id) ON DELETE CASCADE,
    to_goal_id UUID NOT NULL REFERENCES learning_goal_items(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (
        relationship_type IN ('prerequisite_of', 'built_upon', 'parallel_with')
    ),
    strength DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0 for relationship strength
    auto_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(from_goal_id, to_goal_id, relationship_type),
    INDEX idx_lg_rel_from (from_goal_id),
    INDEX idx_lg_rel_to (to_goal_id)
);

-- Learning Goal Review State
CREATE TABLE learning_goal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_goal_id UUID NOT NULL REFERENCES learning_goal_items(id),
    review_status VARCHAR(50) NOT NULL CHECK (
        review_status IN ('pending', 'approved', 'edited_approved', 'refinement_requested', 'rejected')
    ),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    edited_title TEXT,
    edited_description TEXT,
    edited_bloom_level VARCHAR(50),
    refinement_prompt TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_lg_review_goal (learning_goal_id),
    INDEX idx_lg_review_status (review_status)
);

-- Bloom's Taxonomy Templates
CREATE TABLE bloom_taxonomy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(50) NOT NULL UNIQUE,
    level_order INTEGER NOT NULL,
    description TEXT,
    action_verbs TEXT[], -- Array of action verbs for this level
    question_stems TEXT[], -- Question stems for assessment
    ai_prompt_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Goal Generation Configurations
CREATE TABLE learning_goal_generation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    config_name VARCHAR(255) NOT NULL,
    generation_rules JSONB NOT NULL DEFAULT '{
        "max_goals_per_concept": 5,
        "min_goals_per_concept": 2,
        "bloom_distribution": {
            "remember": 0.15,
            "understand": 0.20,
            "apply": 0.25,
            "analyze": 0.20,
            "evaluate": 0.10,
            "create": 0.10
        },
        "complexity_mapping": {
            "beginner": ["remember", "understand"],
            "intermediate": ["understand", "apply", "analyze"],
            "advanced": ["analyze", "evaluate", "create"]
        }
    }',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_lg_config_tenant (tenant_id)
);
```

### Supporting Tables

```sql
-- Learning Goal Processing Logs
CREATE TABLE learning_goal_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES learning_goal_processing_queue(id),
    log_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_lg_logs_queue (queue_id, created_at)
);

-- Learning Goal Templates (Reusable)
CREATE TABLE learning_goal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id),
    template_name VARCHAR(255) NOT NULL,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Processing Pipeline

### Pipeline Architecture

```typescript
// Core Pipeline Stages
interface LearningGoalPipeline {
    stages: {
        ingestion: IngestionStage;
        enrichment: EnrichmentStage;
        generation: GenerationStage;
        sequencing: SequencingStage;
        validation: ValidationStage;
        review: ReviewStage;
        publishing: PublishingStage;
    };
}

// Stage Definitions
interface IngestionStage {
    processors: {
        conceptBasedGenerator: ConceptToGoalProcessor;
        uploadProcessor: UploadedGoalProcessor;
        contextExtractor: ConceptContextExtractor;
    };
    
    outputs: {
        rawGoals: RawLearningGoal[];
        conceptMappings: ConceptGoalMapping[];
        processingMetadata: ProcessingMetadata;
    };
}

interface EnrichmentStage {
    processors: {
        bloomClassifier: BloomTaxonomyClassifier;
        titleRefiner: AITitleRefiner;
        descriptionEnhancer: AIDescriptionEnhancer;
        conceptLinker: ConceptDependencyLinker;
    };
    
    outputs: {
        enrichedGoals: EnrichedLearningGoal[];
        bloomMappings: BloomClassification[];
        conceptRelations: ConceptRelationship[];
    };
}

interface GenerationStage {
    processors: {
        aiGenerator: OpenAIGenerator;
        templateApplicator: TemplateProcessor;
        variationGenerator: GoalVariationGenerator;
    };
    
    config: {
        model: 'gpt-4-turbo' | 'gpt-3.5-turbo';
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
    };
}

interface SequencingStage {
    algorithms: {
        topologicalSort: TopologicalSequencer;
        difficultyProgression: DifficultyBasedSequencer;
        bloomProgression: BloomLevelSequencer;
        hybridSequencer: HybridSequencingAlgorithm;
    };
    
    constraints: {
        prerequisiteRules: PrerequisiteRule[];
        parallelLearningGroups: ParallelGroup[];
        sequenceOptimization: OptimizationStrategy;
    };
}
```

### Processing Flow Implementation

```typescript
class LearningGoalProcessingService {
    async processConceptBasedGeneration(
        conceptIds: string[],
        config: GenerationConfig
    ): Promise<ProcessingResult> {
        // Step 1: Load concepts with full context
        const concepts = await this.loadConceptsWithHierarchy(conceptIds);
        
        // Step 2: Generate learning goals per concept
        const generationTasks = concepts.map(concept => ({
            conceptId: concept.id,
            prompt: this.buildConceptPrompt(concept, config),
            expectedGoals: this.calculateGoalCount(concept.difficulty)
        }));
        
        // Step 3: Parallel AI generation
        const generatedGoals = await this.batchGenerateGoals(generationTasks);
        
        // Step 4: Apply Bloom's taxonomy
        const classifiedGoals = await this.classifyBloomLevels(generatedGoals);
        
        // Step 5: Establish relationships
        const linkedGoals = await this.establishGoalRelationships(
            classifiedGoals,
            concepts
        );
        
        // Step 6: Sequence goals
        const sequencedGoals = await this.sequenceGoals(linkedGoals);
        
        // Step 7: Prepare for review
        return this.prepareForReview(sequencedGoals);
    }
    
    async processUploadedGoals(
        uploadData: UploadedGoalData,
        refinementConfig: RefinementConfig
    ): Promise<ProcessingResult> {
        // Step 1: Validate uploaded data
        const validationResult = await this.validateUpload(uploadData);
        
        // Step 2: Extract and verify concept associations
        const conceptMappings = await this.mapUploadedConcepts(
            uploadData.concepts
        );
        
        // Step 3: Refine titles and descriptions if requested
        let processedGoals = uploadData.goals;
        if (refinementConfig.refineTitle || refinementConfig.refineDescription) {
            processedGoals = await this.refineGoalContent(
                processedGoals,
                refinementConfig
            );
        }
        
        // Step 4: Auto-classify Bloom's levels
        const classifiedGoals = await this.inferBloomLevels(processedGoals);
        
        // Step 5: Generate missing relationships
        const completeGoals = await this.completeRelationships(
            classifiedGoals,
            conceptMappings
        );
        
        // Step 6: Optimize sequence
        const sequencedGoals = await this.optimizeSequence(completeGoals);
        
        return this.prepareForReview(sequencedGoals);
    }
}
```

---

## 3. Bloom's Taxonomy Integration

### Classification System

```typescript
interface BloomTaxonomySystem {
    levels: BloomLevel[];
    classifier: BloomClassifier;
    validator: BloomValidator;
    distributor: BloomDistributor;
}

interface BloomLevel {
    name: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    order: number;
    cognitiveComplexity: number;
    actionVerbs: string[];
    assessmentTypes: string[];
    aiPromptTemplates: PromptTemplate[];
}

class BloomClassifier {
    private readonly verbMappings = {
        remember: ['identify', 'list', 'name', 'recall', 'recognize', 'select'],
        understand: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
        apply: ['implement', 'use', 'execute', 'solve', 'demonstrate'],
        analyze: ['compare', 'contrast', 'examine', 'differentiate', 'organize'],
        evaluate: ['assess', 'judge', 'critique', 'defend', 'justify'],
        create: ['design', 'construct', 'develop', 'formulate', 'invent']
    };
    
    async classifyGoal(goal: LearningGoal): Promise<BloomClassification> {
        // NLP-based classification
        const textAnalysis = await this.analyzeGoalText(goal);
        
        // Verb-based classification
        const verbClassification = this.classifyByVerbs(goal.title);
        
        // Context-based classification
        const contextClassification = this.classifyByContext(
            goal.concepts,
            goal.description
        );
        
        // Weighted combination
        return this.combineClassifications([
            { method: 'nlp', result: textAnalysis, weight: 0.4 },
            { method: 'verb', result: verbClassification, weight: 0.35 },
            { method: 'context', result: contextClassification, weight: 0.25 }
        ]);
    }
    
    async distributeGoalsAcrossLevels(
        goals: LearningGoal[],
        distribution: BloomDistribution
    ): Promise<LearningGoal[]> {
        const totalGoals = goals.length;
        const targetCounts = this.calculateTargetCounts(totalGoals, distribution);
        
        // Initial classification
        let classifiedGoals = await Promise.all(
            goals.map(goal => this.classifyGoal(goal))
        );
        
        // Rebalance if needed
        classifiedGoals = this.rebalanceDistribution(
            classifiedGoals,
            targetCounts
        );
        
        return this.applyClassifications(goals, classifiedGoals);
    }
}

class BloomValidator {
    validateProgression(goals: LearningGoal[]): ValidationResult {
        const issues: ValidationIssue[] = [];
        
        // Check for proper cognitive progression
        const progression = this.analyzeProgression(goals);
        if (!progression.isValid) {
            issues.push({
                type: 'progression',
                message: 'Learning goals do not follow proper cognitive progression',
                suggestion: this.suggestProgressionFix(progression)
            });
        }
        
        // Check for balanced distribution
        const distribution = this.analyzeDistribution(goals);
        if (!distribution.isBalanced) {
            issues.push({
                type: 'distribution',
                message: 'Bloom levels are not properly distributed',
                suggestion: this.suggestDistributionFix(distribution)
            });
        }
        
        return { isValid: issues.length === 0, issues };
    }
}
```

---

## 4. Learning Goal Sequencing Algorithm

### Sequencing Engine

```typescript
class LearningGoalSequencer {
    private readonly strategies: SequencingStrategy[] = [
        new PrerequisiteBasedStrategy(),
        new BloomProgressionStrategy(),
        new ConceptDependencyStrategy(),
        new DifficultyGradientStrategy()
    ];
    
    async sequenceGoals(
        goals: LearningGoal[],
        relationships: GoalRelationship[],
        config: SequencingConfig
    ): Promise<SequencedGoal[]> {
        // Build dependency graph
        const graph = this.buildDependencyGraph(goals, relationships);
        
        // Detect cycles
        if (this.hasCycles(graph)) {
            throw new SequencingError('Circular dependencies detected');
        }
        
        // Apply sequencing strategies
        let sequence = this.topologicalSort(graph);
        
        // Optimize based on selected strategy
        switch (config.strategy) {
            case 'strict_prerequisite':
                sequence = this.enforceStrictPrerequisites(sequence, graph);
                break;
            case 'bloom_progression':
                sequence = this.optimizeBloomProgression(sequence);
                break;
            case 'adaptive':
                sequence = this.adaptiveSequencing(sequence, config);
                break;
            case 'hybrid':
                sequence = this.hybridSequencing(sequence, config);
                break;
        }
        
        // Handle parallel learning groups
        sequence = this.identifyParallelGroups(sequence, relationships);
        
        return this.assignSequenceNumbers(sequence);
    }
    
    private buildDependencyGraph(
        goals: LearningGoal[],
        relationships: GoalRelationship[]
    ): DependencyGraph {
        const graph = new DependencyGraph();
        
        // Add nodes
        goals.forEach(goal => {
            graph.addNode(goal.id, goal);
        });
        
        // Add edges based on relationships
        relationships.forEach(rel => {
            switch (rel.type) {
                case 'prerequisite_of':
                    graph.addEdge(rel.fromId, rel.toId, rel.strength);
                    break;
                case 'built_upon':
                    graph.addEdge(rel.fromId, rel.toId, rel.strength * 0.8);
                    break;
                case 'parallel_with':
                    graph.markParallel(rel.fromId, rel.toId);
                    break;
            }
        });
        
        return graph;
    }
    
    private topologicalSort(graph: DependencyGraph): LearningGoal[] {
        const sorted: LearningGoal[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();
        
        const visit = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            if (visiting.has(nodeId)) {
                throw new Error('Cycle detected');
            }
            
            visiting.add(nodeId);
            
            const dependencies = graph.getDependencies(nodeId);
            dependencies.forEach(depId => visit(depId));
            
            visiting.delete(nodeId);
            visited.add(nodeId);
            sorted.push(graph.getNode(nodeId));
        };
        
        graph.getNodes().forEach(node => visit(node.id));
        
        return sorted;
    }
    
    private hybridSequencing(
        goals: LearningGoal[],
        config: SequencingConfig
    ): LearningGoal[] {
        // Combine multiple strategies with weights
        const strategies = [
            { strategy: this.prerequisiteStrategy, weight: 0.4 },
            { strategy: this.bloomStrategy, weight: 0.3 },
            { strategy: this.difficultyStrategy, weight: 0.2 },
            { strategy: this.conceptStrategy, weight: 0.1 }
        ];
        
        const scores = new Map<string, number>();
        
        strategies.forEach(({ strategy, weight }) => {
            const strategyScores = strategy(goals);
            strategyScores.forEach((score, goalId) => {
                const current = scores.get(goalId) || 0;
                scores.set(goalId, current + score * weight);
            });
        });
        
        // Sort by combined scores
        return goals.sort((a, b) => {
            const scoreA = scores.get(a.id) || 0;
            const scoreB = scores.get(b.id) || 0;
            return scoreA - scoreB;
        });
    }
}

class ParallelGroupIdentifier {
    identifyParallelGroups(
        goals: SequencedGoal[],
        relationships: GoalRelationship[]
    ): ParallelGroup[] {
        const groups: ParallelGroup[] = [];
        const parallelPairs = relationships.filter(r => r.type === 'parallel_with');
        
        // Build parallel clusters
        const clusters = this.buildClusters(parallelPairs);
        
        // Validate and create groups
        clusters.forEach(cluster => {
            const group: ParallelGroup = {
                id: generateId(),
                goals: cluster.map(id => goals.find(g => g.id === id)!),
                sequenceRange: this.calculateSequenceRange(cluster, goals),
                rationale: this.generateRationale(cluster, goals)
            };
            groups.push(group);
        });
        
        return groups;
    }
}
```

---

## 5. Dependency Management

### Dependency Management System

```typescript
interface DependencyManagementSystem {
    analyzer: DependencyAnalyzer;
    resolver: DependencyResolver;
    validator: DependencyValidator;
    optimizer: DependencyOptimizer;
}

class DependencyAnalyzer {
    async analyzeDependencies(
        goals: LearningGoal[],
        concepts: Concept[]
    ): Promise<DependencyAnalysis> {
        // Concept-based dependencies
        const conceptDeps = this.analyzeConceptDependencies(goals, concepts);
        
        // Bloom level dependencies
        const bloomDeps = this.analyzeBloomDependencies(goals);
        
        // Content-based dependencies (NLP)
        const contentDeps = await this.analyzeContentDependencies(goals);
        
        // Skill progression dependencies
        const skillDeps = this.analyzeSkillDependencies(goals);
        
        return {
            conceptual: conceptDeps,
            cognitive: bloomDeps,
            content: contentDeps,
            skill: skillDeps,
            combined: this.combineDependencies([
                conceptDeps,
                bloomDeps,
                contentDeps,
                skillDeps
            ])
        };
    }
    
    private analyzeConceptDependencies(
        goals: LearningGoal[],
        concepts: Concept[]
    ): ConceptDependency[] {
        const dependencies: ConceptDependency[] = [];
        
        // Build concept hierarchy
        const hierarchy = this.buildConceptHierarchy(concepts);
        
        goals.forEach(goal => {
            const goalConcepts = goal.concepts;
            
            // Find dependencies based on concept relationships
            goalConcepts.forEach(conceptId => {
                const prerequisites = hierarchy.getPrerequisites(conceptId);
                prerequisites.forEach(prereq => {
                    const dependentGoals = goals.filter(g => 
                        g.concepts.includes(prereq)
                    );
                    
                    dependentGoals.forEach(depGoal => {
                        if (depGoal.id !== goal.id) {
                            dependencies.push({
                                from: depGoal.id,
                                to: goal.id,
                                type: 'concept_prerequisite',
                                strength: this.calculateStrength(prereq, conceptId)
                            });
                        }
                    });
                });
            });
        });
        
        return dependencies;
    }
}

class DependencyResolver {
    async resolveDependencies(
        goals: LearningGoal[],
        dependencies: Dependency[]
    ): Promise<ResolvedDependencies> {
        // Detect conflicts
        const conflicts = this.detectConflicts(dependencies);
        
        // Resolve conflicts
        const resolved = await this.resolveConflicts(conflicts);
        
        // Optimize dependency graph
        const optimized = this.optimizeDependencyGraph(resolved);
        
        // Generate execution order
        const executionOrder = this.generateExecutionOrder(optimized);
        
        return {
            dependencies: optimized,
            executionOrder,
            conflicts: conflicts.filter(c => !c.resolved),
            warnings: this.generateWarnings(optimized)
        };
    }
    
    private detectConflicts(dependencies: Dependency[]): Conflict[] {
        const conflicts: Conflict[] = [];
        
        // Circular dependency detection
        const cycles = this.detectCycles(dependencies);
        cycles.forEach(cycle => {
            conflicts.push({
                type: 'circular',
                involved: cycle,
                severity: 'critical',
                resolution: 'break_cycle'
            });
        });
        
        // Contradictory dependencies
        const contradictions = this.detectContradictions(dependencies);
        contradictions.forEach(contradiction => {
            conflicts.push({
                type: 'contradiction',
                involved: contradiction,
                severity: 'major',
                resolution: 'choose_stronger'
            });
        });
        
        return conflicts;
    }
}
```

---

## 6. UI/UX Flow

### User Interface Design

```typescript
// Option A: Concept-Based Generation Flow
interface ConceptBasedGenerationFlow {
    steps: [
        {
            name: 'ConceptSelection';
            component: 'ConceptSelector';
            actions: {
                selectConcepts: (conceptIds: string[]) => void;
                previewSelection: () => ConceptPreview;
                validateSelection: () => ValidationResult;
            };
        },
        {
            name: 'GenerationConfiguration';
            component: 'GenerationConfigurator';
            settings: {
                goalsPerConcept: RangeSelector;
                bloomDistribution: BloomDistributionEditor;
                difficultyMapping: DifficultyMappingEditor;
                aiModel: ModelSelector;
            };
        },
        {
            name: 'AIProcessing';
            component: 'ProcessingMonitor';
            displays: {
                progressBar: ProgressIndicator;
                currentTask: string;
                estimatedTime: TimeEstimate;
                logs: ProcessingLog[];
            };
        },
        {
            name: 'InitialReview';
            component: 'GeneratedGoalsReviewer';
            features: {
                bulkActions: BulkActionBar;
                individualEditing: InlineEditor;
                sequenceAdjustment: DragDropSequencer;
                relationshipViewer: GraphVisualizer;
            };
        }
    ];
}

// Option B: Upload and Refinement Flow
interface UploadRefinementFlow {
    steps: [
        {
            name: 'FileUpload';
            component: 'GoalUploader';
            validators: {
                fileFormat: FormatValidator;
                schemaValidation: SchemaValidator;
                conceptMapping: ConceptMapper;
            };
            features: {
                dragDrop: boolean;
                templateDownload: boolean;
                previewData: DataPreview;
            };
        },
        {
            name: 'ContextConfiguration';
            component: 'ContextConfigurator';
            required: {
                concepts: ConceptAssociator;
                relationships: RelationshipEditor;
                metadata: MetadataEditor;
            };
        },
        {
            name: 'RefinementSettings';
            component: 'RefinementConfigurator';
            options: {
                refineTitle: {
                    enabled: boolean;
                    style: 'concise' | 'descriptive' | 'action-oriented';
                    maxLength: number;
                };
                refineDescription: {
                    enabled: boolean;
                    style: 'detailed' | 'summary' | 'behavioral';
                    includeExamples: boolean;
                };
                autoClassifyBloom: boolean;
                generateRelationships: boolean;
            };
        },
        {
            name: 'Processing';
            component: 'RefinementProcessor';
            displays: {
                comparisonView: BeforeAfterComparison;
                progressTracking: BatchProgressTracker;
                errorHandling: ErrorRecoveryInterface;
            };
        }
    ];
}

// Shared Review Interface
interface ReviewInterface {
    layout: {
        type: 'split-view' | 'card-grid' | 'table';
        sections: {
            pending: ReviewQueue;
            inReview: ActiveReviewPanel;
            approved: ApprovedGoalsPanel;
            rejected: RejectedGoalsPanel;
        };
    };
    
    features: {
        bulkOperations: {
            selectAll: () => void;
            approveSelected: () => void;
            rejectSelected: () => void;
            requestRefinement: (prompt: string) => void;
        };
        
        individualActions: {
            approve: (goalId: string) => void;
            editAndApprove: (goalId: string, edits: GoalEdits) => void;
            requestRefinement: (goalId: string, prompt: string) => void;
            reject: (goalId: string, reason: string) => void;
            viewDetails: (goalId: string) => DetailedView;
        };
        
        visualization: {
            dependencyGraph: DependencyGraphViewer;
            bloomDistribution: BloomChartViewer;
            sequenceTimeline: SequenceTimelineViewer;
            conceptMapping: ConceptMappingViewer;
        };
    };
}
```

### React Components Structure

```tsx
// Main Learning Goals Management Component
const LearningGoalsManagement: React.FC = () => {
    const [mode, setMode] = useState<'generate' | 'upload' | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [processingQueue, setProcessingQueue] = useState<ProcessingQueue>();
    
    return (
        <div className="learning-goals-management">
            {!mode && (
                <ModeSelector 
                    onSelectGenerate={() => setMode('generate')}
                    onSelectUpload={() => setMode('upload')}
                />
            )}
            
            {mode === 'generate' && (
                <ConceptBasedFlow 
                    step={currentStep}
                    onStepComplete={() => setCurrentStep(prev => prev + 1)}
                    queue={processingQueue}
                />
            )}
            
            {mode === 'upload' && (
                <UploadFlow
                    step={currentStep}
                    onStepComplete={() => setCurrentStep(prev => prev + 1)}
                    queue={processingQueue}
                />
            )}
        </div>
    );
};

// Concept Selection Component
const ConceptSelector: React.FC<ConceptSelectorProps> = ({ onSelect }) => {
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { concepts, loading } = useConcepts();
    
    return (
        <div className="concept-selector">
            <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search concepts..."
            />
            
            <ConceptTree
                concepts={concepts}
                selected={selectedConcepts}
                onToggle={(id) => toggleConcept(id)}
                searchQuery={searchQuery}
            />
            
            <SelectionSummary
                selected={selectedConcepts}
                concepts={concepts}
            />
            
            <ActionBar>
                <Button 
                    onClick={() => onSelect(selectedConcepts)}
                    disabled={selectedConcepts.length === 0}
                >
                    Generate Learning Goals
                </Button>
            </ActionBar>
        </div>
    );
};

// Review Dashboard Component
const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ queue }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'graph'>('grid');
    
    return (
        <div className="review-dashboard">
            <ReviewHeader
                stats={queue.stats}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
            
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{
                    pending: queue.pending.length,
                    approved: queue.approved.length,
                    rejected: queue.rejected.length
                }}
            />
            
            <BulkActions
                selectedCount={selectedGoals.length}
                onApproveAll={() => bulkApprove(selectedGoals)}
                onRejectAll={() => bulkReject(selectedGoals)}
                onRequestRefinement={() => openRefinementDialog(selectedGoals)}
            />
            
            {viewMode === 'grid' && (
                <GoalGrid
                    goals={getGoalsByTab(activeTab)}
                    selected={selectedGoals}
                    onSelect={setSelectedGoals}
                    onAction={handleGoalAction}
                />
            )}
            
            {viewMode === 'table' && (
                <GoalTable
                    goals={getGoalsByTab(activeTab)}
                    selected={selectedGoals}
                    onSelect={setSelectedGoals}
                    onAction={handleGoalAction}
                />
            )}
            
            {viewMode === 'graph' && (
                <DependencyGraph
                    goals={queue.all}
                    relationships={queue.relationships}
                    onNodeClick={handleNodeClick}
                />
            )}
        </div>
    );
};
```

---

## 7. Review Workflow

### Review Process Implementation

```typescript
interface ReviewWorkflow {
    stages: ReviewStage[];
    actions: ReviewAction[];
    transitions: StateTransition[];
    notifications: NotificationConfig[];
}

class ReviewOrchestrator {
    private readonly stages = [
        'initial_review',
        'refinement',
        'final_approval',
        'publishing'
    ];
    
    async processReviewAction(
        goalId: string,
        action: ReviewAction,
        context: ReviewContext
    ): Promise<ReviewResult> {
        const goal = await this.loadGoal(goalId);
        const currentState = goal.reviewState;
        
        switch (action.type) {
            case 'approve':
                return this.handleApproval(goal, context);
                
            case 'edit_and_approve':
                return this.handleEditAndApprove(goal, action.edits, context);
                
            case 'request_refinement':
                return this.handleRefinementRequest(goal, action.prompt, context);
                
            case 'reject':
                return this.handleRejection(goal, action.reason, context);
                
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    
    private async handleEditAndApprove(
        goal: LearningGoal,
        edits: GoalEdits,
        context: ReviewContext
    ): Promise<ReviewResult> {
        // Validate edits
        const validation = await this.validateEdits(edits);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }
        
        // Apply edits
        const editedGoal = {
            ...goal,
            title: edits.title || goal.title,
            description: edits.description || goal.description,
            bloomLevel: edits.bloomLevel || goal.bloomLevel,
            reviewState: 'edited_approved',
            lastReviewedBy: context.userId,
            lastReviewedAt: new Date()
        };
        
        // Save to database
        await this.saveGoal(editedGoal);
        
        // Update relationships if needed
        if (edits.relationships) {
            await this.updateRelationships(goal.id, edits.relationships);
        }
        
        // Trigger post-approval workflows
        await this.triggerPostApprovalWorkflows(editedGoal);
        
        return {
            success: true,
            goal: editedGoal,
            nextSteps: this.determineNextSteps(editedGoal)
        };
    }
    
    private async handleRefinementRequest(
        goal: LearningGoal,
        refinementPrompt: string,
        context: ReviewContext
    ): Promise<ReviewResult> {
        // Create refinement task
        const refinementTask = {
            goalId: goal.id,
            prompt: refinementPrompt,
            requestedBy: context.userId,
            requestedAt: new Date(),
            priority: this.calculatePriority(goal)
        };
        
        // Queue for AI processing
        const queueResult = await this.queueRefinement(refinementTask);
        
        // Update goal state
        await this.updateGoalState(goal.id, {
            reviewState: 'refinement_requested',
            refinementPrompt,
            refinementQueueId: queueResult.queueId
        });
        
        // Send notifications
        await this.notifyStakeholders({
            type: 'refinement_requested',
            goal,
            refinementTask
        });
        
        return {
            success: true,
            queueId: queueResult.queueId,
            estimatedCompletionTime: queueResult.estimatedTime
        };
    }
}

// Batch Review Operations
class BatchReviewProcessor {
    async processBatchAction(
        goalIds: string[],
        action: BatchAction,
        context: ReviewContext
    ): Promise<BatchReviewResult> {
        const results: ReviewResult[] = [];
        const errors: ReviewError[] = [];
        
        // Process in parallel with rate limiting
        const chunks = this.chunkArray(goalIds, 10);
        
        for (const chunk of chunks) {
            const chunkResults = await Promise.allSettled(
                chunk.map(goalId => 
                    this.processSingleGoal(goalId, action, context)
                )
            );
            
            chunkResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    errors.push({
                        goalId: chunk[index],
                        error: result.reason
                    });
                }
            });
        }
        
        return {
            processed: results.length,
            failed: errors.length,
            results,
            errors
        };
    }
}
```

---

## 8. API Endpoints

### RESTful API Design

```typescript
// Learning Goals API Routes
interface LearningGoalsAPI {
    // Generation Endpoints
    POST   /api/learning-goals/generate/from-concepts
    POST   /api/learning-goals/upload
    POST   /api/learning-goals/refine/:batchId
    
    // Processing Status
    GET    /api/learning-goals/processing/:queueId
    GET    /api/learning-goals/processing/:queueId/logs
    POST   /api/learning-goals/processing/:queueId/cancel
    
    // Review Endpoints
    GET    /api/learning-goals/review/pending
    GET    /api/learning-goals/review/approved
    GET    /api/learning-goals/review/rejected
    POST   /api/learning-goals/review/:goalId/approve
    POST   /api/learning-goals/review/:goalId/edit
    POST   /api/learning-goals/review/:goalId/refine
    POST   /api/learning-goals/review/:goalId/reject
    POST   /api/learning-goals/review/batch
    
    // Relationship Management
    GET    /api/learning-goals/:goalId/relationships
    POST   /api/learning-goals/:goalId/relationships
    PUT    /api/learning-goals/:goalId/relationships/:relationshipId
    DELETE /api/learning-goals/:goalId/relationships/:relationshipId
    
    // Sequencing
    GET    /api/learning-goals/sequence
    POST   /api/learning-goals/sequence/recalculate
    PUT    /api/learning-goals/sequence/manual
    
    // Bloom Taxonomy
    GET    /api/learning-goals/bloom/distribution
    POST   /api/learning-goals/bloom/reclassify/:goalId
    GET    /api/learning-goals/bloom/templates
    
    // Export/Import
    GET    /api/learning-goals/export
    POST   /api/learning-goals/import
    GET    /api/learning-goals/templates
    POST   /api/learning-goals/templates
}

// Endpoint Implementations
class LearningGoalsController {
    // Generate from concepts
    async generateFromConcepts(req: Request, res: Response) {
        const { conceptIds, config } = req.body;
        
        // Validate input
        const validation = await this.validateConceptGeneration(conceptIds, config);
        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Create processing queue
        const queue = await this.createProcessingQueue({
            type: 'concept_generation',
            tenantId: req.user.tenantId,
            userId: req.user.id,
            metadata: { conceptIds, config }
        });
        
        // Start async processing
        this.processConceptGeneration(queue.id, conceptIds, config);
        
        return res.status(202).json({
            queueId: queue.id,
            status: 'processing',
            estimatedTime: this.estimateProcessingTime(conceptIds.length),
            pollUrl: `/api/learning-goals/processing/${queue.id}`
        });
    }
    
    // Upload and refine
    async uploadGoals(req: Request, res: Response) {
        const file = req.file;
        const { refinementConfig } = req.body;
        
        // Parse uploaded file
        const parsedData = await this.parseUploadedFile(file);
        
        // Validate data structure
        const validation = await this.validateUploadedData(parsedData);
        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Create processing queue
        const queue = await this.createProcessingQueue({
            type: 'upload_refinement',
            tenantId: req.user.tenantId,
            userId: req.user.id,
            metadata: { 
                fileName: file.originalname,
                goalCount: parsedData.goals.length,
                refinementConfig 
            }
        });
        
        // Start async processing
        this.processUploadedGoals(queue.id, parsedData, refinementConfig);
        
        return res.status(202).json({
            queueId: queue.id,
            status: 'processing',
            goalsCount: parsedData.goals.length,
            pollUrl: `/api/learning-goals/processing/${queue.id}`
        });
    }
    
    // Review actions
    async approveGoal(req: Request, res: Response) {
        const { goalId } = req.params;
        const { notes } = req.body;
        
        const result = await this.reviewService.approve(goalId, {
            userId: req.user.id,
            notes
        });
        
        return res.json(result);
    }
    
    async editAndApprove(req: Request, res: Response) {
        const { goalId } = req.params;
        const { edits, notes } = req.body;
        
        const result = await this.reviewService.editAndApprove(goalId, {
            edits,
            userId: req.user.id,
            notes
        });
        
        return res.json(result);
    }
    
    async requestRefinement(req: Request, res: Response) {
        const { goalId } = req.params;
        const { prompt, priority } = req.body;
        
        const result = await this.reviewService.requestRefinement(goalId, {
            prompt,
            priority,
            userId: req.user.id
        });
        
        return res.status(202).json(result);
    }
}
```

---

## 9. Validation Rules

### Validation System

```typescript
interface ValidationSystem {
    validators: {
        structure: StructureValidator;
        content: ContentValidator;
        relationships: RelationshipValidator;
        bloom: BloomValidator;
        sequence: SequenceValidator;
    };
    
    rules: ValidationRule[];
    schemas: ValidationSchema[];
}

class UploadValidator {
    private readonly requiredFields = [
        'goals',
        'concepts',
        'relationships'
    ];
    
    private readonly goalSchema = {
        id: { type: 'string', required: false },
        title: { type: 'string', required: true, minLength: 5, maxLength: 200 },
        description: { type: 'string', required: false, maxLength: 1000 },
        conceptIds: { type: 'array', required: true, minItems: 1 },
        bloomLevel: { 
            type: 'string', 
            required: false,
            enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
        }
    };
    
    private readonly conceptSchema = {
        id: { type: 'string', required: true },
        title: { type: 'string', required: true },
        description: { type: 'string', required: true },
        difficulty: { 
            type: 'string', 
            required: true,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        parentId: { type: 'string', required: false }
    };
    
    async validateUpload(data: any): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        
        // Structure validation
        const structureErrors = this.validateStructure(data);
        errors.push(...structureErrors);
        
        // Goal validation
        if (data.goals) {
            const goalErrors = this.validateGoals(data.goals);
            errors.push(...goalErrors);
        }
        
        // Concept validation
        if (data.concepts) {
            const conceptErrors = this.validateConcepts(data.concepts);
            errors.push(...conceptErrors);
        }
        
        // Relationship validation
        if (data.relationships) {
            const relationshipErrors = this.validateRelationships(
                data.relationships,
                data.goals,
                data.concepts
            );
            errors.push(...relationshipErrors);
        }
        
        // Cross-validation
        const crossErrors = this.crossValidate(data);
        errors.push(...crossErrors);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings: this.generateWarnings(data)
        };
    }
    
    private validateGoals(goals: any[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const seenIds = new Set<string>();
        
        goals.forEach((goal, index) => {
            // Check required fields
            Object.entries(this.goalSchema).forEach(([field, rules]) => {
                if (rules.required && !goal[field]) {
                    errors.push({
                        path: `goals[${index}].${field}`,
                        message: `${field} is required`,
                        severity: 'error'
                    });
                }
                
                // Type validation
                if (goal[field] && rules.type) {
                    const actualType = Array.isArray(goal[field]) ? 'array' : typeof goal[field];
                    if (actualType !== rules.type) {
                        errors.push({
                            path: `goals[${index}].${field}`,
                            message: `${field} must be of type ${rules.type}`,
                            severity: 'error'
                        });
                    }
                }
                
                // Length validation
                if (goal[field] && rules.minLength) {
                    if (goal[field].length < rules.minLength) {
                        errors.push({
                            path: `goals[${index}].${field}`,
                            message: `${field} must be at least ${rules.minLength} characters`,
                            severity: 'error'
                        });
                    }
                }
                
                // Enum validation
                if (goal[field] && rules.enum) {
                    if (!rules.enum.includes(goal[field])) {
                        errors.push({
                            path: `goals[${index}].${field}`,
                            message: `${field} must be one of: ${rules.enum.join(', ')}`,
                            severity: 'error'
                        });
                    }
                }
            });
            
            // Check for duplicate IDs
            if (goal.id) {
                if (seenIds.has(goal.id)) {
                    errors.push({
                        path: `goals[${index}].id`,
                        message: `Duplicate goal ID: ${goal.id}`,
                        severity: 'error'
                    });
                }
                seenIds.add(goal.id);
            }
        });
        
        return errors;
    }
    
    private crossValidate(data: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        // Check that all referenced concepts exist
        const conceptIds = new Set(data.concepts?.map((c: any) => c.id) || []);
        
        data.goals?.forEach((goal: any, index: number) => {
            goal.conceptIds?.forEach((conceptId: string) => {
                if (!conceptIds.has(conceptId)) {
                    errors.push({
                        path: `goals[${index}].conceptIds`,
                        message: `Referenced concept ${conceptId} not found in concepts list`,
                        severity: 'error'
                    });
                }
            });
        });
        
        // Check relationship references
        const goalIds = new Set(data.goals?.map((g: any) => g.id) || []);
        
        data.relationships?.forEach((rel: any, index: number) => {
            if (!goalIds.has(rel.fromGoalId)) {
                errors.push({
                    path: `relationships[${index}].fromGoalId`,
                    message: `Referenced goal ${rel.fromGoalId} not found`,
                    severity: 'error'
                });
            }
            if (!goalIds.has(rel.toGoalId)) {
                errors.push({
                    path: `relationships[${index}].toGoalId`,
                    message: `Referenced goal ${rel.toGoalId} not found`,
                    severity: 'error'
                });
            }
        });
        
        return errors;
    }
}

class RelationshipValidator {
    validateRelationships(
        relationships: any[],
        goals: any[]
    ): ValidationError[] {
        const errors: ValidationError[] = [];
        
        // Check for cycles
        const cycles = this.detectCycles(relationships);
        if (cycles.length > 0) {
            cycles.forEach(cycle => {
                errors.push({
                    path: 'relationships',
                    message: `Circular dependency detected: ${cycle.join(' -> ')}`,
                    severity: 'error'
                });
            });
        }
        
        // Check for conflicting relationships
        const conflicts = this.detectConflicts(relationships);
        conflicts.forEach(conflict => {
            errors.push({
                path: 'relationships',
                message: `Conflicting relationships: ${conflict.description}`,
                severity: 'warning'
            });
        });
        
        // Validate relationship types
        const validTypes = ['prerequisite_of', 'built_upon', 'parallel_with'];
        relationships.forEach((rel, index) => {
            if (!validTypes.includes(rel.type)) {
                errors.push({
                    path: `relationships[${index}].type`,
                    message: `Invalid relationship type: ${rel.type}`,
                    severity: 'error'
                });
            }
        });
        
        return errors;
    }
}
```

---

## 10. AI Processing Prompts

### Prompt Templates

```typescript
interface PromptTemplates {
    conceptToGoals: ConceptGoalGenerationPrompt;
    titleRefinement: TitleRefinementPrompt;
    descriptionRefinement: DescriptionRefinementPrompt;
    bloomClassification: BloomClassificationPrompt;
    relationshipGeneration: RelationshipGenerationPrompt;
    sequenceOptimization: SequenceOptimizationPrompt;
}

class PromptBuilder {
    // Concept-based generation prompt
    buildConceptGenerationPrompt(
        concept: Concept,
        config: GenerationConfig
    ): string {
        return `
You are an expert instructional designer creating learning goals for the following concept:

CONCEPT INFORMATION:
- Title: ${concept.title}
- Description: ${concept.description}
- Difficulty Level: ${concept.difficulty}
- Domain: ${concept.domain}
- Prerequisites: ${concept.prerequisites.join(', ')}

GENERATION REQUIREMENTS:
- Generate ${config.goalsPerConcept} learning goals
- Distribute across Bloom's Taxonomy levels as follows:
  ${this.formatBloomDistribution(config.bloomDistribution)}
- Each goal must be:
  * Specific and measurable
  * Achievable within the difficulty level
  * Relevant to the concept
  * Time-bound (implicitly through course structure)

OUTPUT FORMAT:
For each learning goal, provide:
1. Title (action-oriented, 5-15 words)
2. Description (detailed explanation, 50-150 words)
3. Bloom's level (remember/understand/apply/analyze/evaluate/create)
4. Suggested prerequisites (if any)
5. Assessment suggestions

EXAMPLE OUTPUT:
{
  "goals": [
    {
      "title": "Identify key components of [concept]",
      "description": "Students will be able to recognize and name the fundamental elements...",
      "bloomLevel": "remember",
      "prerequisites": [],
      "assessmentSuggestions": ["Multiple choice quiz", "Labeling exercise"]
    }
  ]
}

Please generate the learning goals following this structure.`;
    }
    
    // Title refinement prompt
    buildTitleRefinementPrompt(
        goal: LearningGoal,
        style: 'concise' | 'descriptive' | 'action-oriented'
    ): string {
        const styleGuides = {
            concise: 'Make the title brief and to the point (5-8 words)',
            descriptive: 'Include context and scope in the title (10-15 words)',
            'action-oriented': 'Start with a strong action verb and focus on outcomes'
        };
        
        return `
Refine the following learning goal title according to the specified style:

CURRENT TITLE: ${goal.title}
STYLE: ${style}
STYLE GUIDE: ${styleGuides[style]}

CONTEXT:
- Associated Concepts: ${goal.concepts.map(c => c.title).join(', ')}
- Bloom's Level: ${goal.bloomLevel}
- Target Audience: ${goal.targetAudience}

REQUIREMENTS:
1. Maintain the core learning objective
2. Use appropriate action verbs for the Bloom's level
3. Be specific and measurable
4. Follow the style guide exactly

BLOOM'S LEVEL ACTION VERBS:
${this.getBloomActionVerbs(goal.bloomLevel)}

Provide only the refined title, nothing else.`;
    }
    
    // Description refinement prompt
    buildDescriptionRefinementPrompt(
        goal: LearningGoal,
        config: DescriptionConfig
    ): string {
        return `
Enhance the learning goal description with the following parameters:

CURRENT DESCRIPTION: ${goal.description || 'Not provided'}
LEARNING GOAL TITLE: ${goal.title}

ENHANCEMENT REQUIREMENTS:
- Style: ${config.style} (detailed/summary/behavioral)
- Include Examples: ${config.includeExamples}
- Length: ${config.minWords}-${config.maxWords} words
- Focus Areas: ${config.focusAreas.join(', ')}

STRUCTURE TEMPLATE:
1. Learning Outcome (what students will achieve)
2. Context/Application (where this knowledge applies)
3. ${config.includeExamples ? 'Concrete Examples' : ''}
4. Success Criteria (how mastery is demonstrated)
5. Connection to broader learning objectives

TONE AND LANGUAGE:
- Use active voice
- Be student-centered
- Include measurable outcomes
- Avoid jargon unless necessary

Provide the enhanced description following this structure.`;
    }
    
    // Bloom classification prompt
    buildBloomClassificationPrompt(goals: LearningGoal[]): string {
        return `
Classify the following learning goals according to Bloom's Taxonomy:

BLOOM'S TAXONOMY LEVELS:
1. Remember - Recall facts and basic concepts
2. Understand - Explain ideas or concepts
3. Apply - Use information in new situations
4. Analyze - Draw connections among ideas
5. Evaluate - Justify a stand or decision
6. Create - Produce new or original work

LEARNING GOALS TO CLASSIFY:
${goals.map((g, i) => `
${i + 1}. Title: ${g.title}
   Description: ${g.description}
`).join('\n')}

For each goal, provide:
1. Bloom's level classification
2. Confidence score (0-1)
3. Key indicators that led to this classification
4. Alternative level if confidence < 0.7

OUTPUT FORMAT:
{
  "classifications": [
    {
      "goalIndex": 1,
      "bloomLevel": "apply",
      "confidence": 0.85,
      "indicators": ["use", "implement", "practical application"],
      "alternativeLevel": null
    }
  ]
}`;
    }
    
    // Relationship generation prompt
    buildRelationshipGenerationPrompt(
        goals: LearningGoal[],
        concepts: Concept[]
    ): string {
        return `
Analyze the following learning goals and identify relationships between them:

RELATIONSHIP TYPES:
1. prerequisite_of - Goal A must be completed before Goal B
2. built_upon - Goal B extends or deepens Goal A
3. parallel_with - Goals can/should be learned simultaneously

LEARNING GOALS:
${goals.map((g, i) => `
Goal ${i + 1}: ${g.title}
- Concepts: ${g.concepts.map(c => c.title).join(', ')}
- Bloom Level: ${g.bloomLevel}
`).join('\n')}

CONCEPT HIERARCHY:
${this.formatConceptHierarchy(concepts)}

ANALYSIS REQUIREMENTS:
1. Consider concept dependencies
2. Respect Bloom's taxonomy progression
3. Identify natural learning sequences
4. Detect parallel learning opportunities
5. Avoid circular dependencies

For each identified relationship, provide:
- From Goal (index)
- To Goal (index)
- Relationship Type
- Strength (0.1-1.0)
- Rationale

OUTPUT FORMAT:
{
  "relationships": [
    {
      "from": 1,
      "to": 3,
      "type": "prerequisite_of",
      "strength": 0.9,
      "rationale": "Goal 1 introduces fundamental concepts required for Goal 3"
    }
  ]
}`;
    }
    
    // Sequence optimization prompt
    buildSequenceOptimizationPrompt(
        goals: LearningGoal[],
        relationships: GoalRelationship[]
    ): string {
        return `
Optimize the learning sequence for the following goals:

CURRENT SEQUENCE:
${goals.map((g, i) => `${i + 1}. ${g.title} (Bloom: ${g.bloomLevel})`).join('\n')}

RELATIONSHIPS:
${relationships.map(r => 
  `${r.fromGoal} ${r.type} ${r.toGoal} (strength: ${r.strength})`
).join('\n')}

OPTIMIZATION CRITERIA:
1. Respect all prerequisite relationships
2. Progress from lower to higher Bloom's levels when possible
3. Group parallel learning goals
4. Minimize cognitive load jumps
5. Create logical thematic clusters
6. Ensure steady difficulty progression

CONSTRAINTS:
- Hard prerequisites must be respected
- Parallel goals should be adjacent
- No more than 3 consecutive goals at the same Bloom's level

Provide:
1. Optimized sequence (ordered list of goal indices)
2. Parallel learning groups
3. Rationale for major sequencing decisions
4. Potential issues or trade-offs

OUTPUT FORMAT:
{
  "optimizedSequence": [1, 2, 4, 3, 5],
  "parallelGroups": [[2, 4], [6, 7]],
  "rationale": "...",
  "considerations": ["..."]
}`;
    }
}

// Prompt execution manager
class AIPromptExecutor {
    private readonly openaiClient: OpenAIClient;
    private readonly anthropicClient: AnthropicClient;
    
    async executePrompt(
        prompt: string,
        config: AIConfig
    ): Promise<AIResponse> {
        const enrichedPrompt = this.enrichPrompt(prompt, config);
        
        switch (config.provider) {
            case 'openai':
                return this.executeOpenAI(enrichedPrompt, config);
            case 'anthropic':
                return this.executeAnthropic(enrichedPrompt, config);
            default:
                throw new Error(`Unknown AI provider: ${config.provider}`);
        }
    }
    
    private enrichPrompt(prompt: string, config: AIConfig): string {
        return `
${config.systemPrompt || 'You are an expert instructional designer.'}

${prompt}

IMPORTANT GUIDELINES:
- Provide response in valid JSON format
- Follow the specified output structure exactly
- Base decisions on pedagogical best practices
- Consider cognitive load theory
- Ensure accessibility and inclusivity
`;
    }
}
```

---

## Implementation Priorities

### Phase 1: Foundation (Weeks 1-2)
1. Extend database schema for learning goals
2. Implement basic CRUD operations
3. Set up processing queue infrastructure
4. Create upload validation system

### Phase 2: AI Integration (Weeks 3-4)
1. Implement concept-to-goal generation
2. Build refinement pipelines
3. Integrate Bloom's taxonomy classification
4. Develop relationship detection

### Phase 3: Sequencing & Dependencies (Weeks 5-6)
1. Implement sequencing algorithms
2. Build dependency management system
3. Create parallel group detection
4. Optimize learning paths

### Phase 4: UI/UX Implementation (Weeks 7-8)
1. Build generation workflow UI
2. Create upload interface
3. Implement review dashboard
4. Add visualization components

### Phase 5: Testing & Optimization (Weeks 9-10)
1. Performance testing and optimization
2. AI prompt refinement
3. User acceptance testing
4. Documentation and training

## Success Metrics

1. **Generation Quality**
   - 90%+ of generated goals align with Bloom's taxonomy
   - 85%+ approval rate on first review
   - Average refinement cycles < 2

2. **Processing Performance**
   - Concept generation: < 30 seconds per concept
   - Upload processing: < 2 minutes for 100 goals
   - Sequencing optimization: < 5 seconds for 200 goals

3. **User Satisfaction**
   - Review workflow completion time < 5 minutes per 10 goals
   - UI responsiveness < 200ms for all interactions
   - 95%+ successful upload validations

4. **System Reliability**
   - 99.9% uptime for processing queue
   - Zero data loss during processing
   - Automatic recovery from AI service failures