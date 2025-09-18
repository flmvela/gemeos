/**
 * Server-Sent Events (SSE) Service
 * Handles real-time updates for content processing pipeline
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProcessingEvent {
  id: string;
  type: 'started' | 'progress' | 'completed' | 'error';
  stage: 'chunking' | 'concept-identification' | 'structuring' | 'goal-generation' | 'exercise-generation';
  message: string;
  progress?: number; // 0-100
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ProcessingStatus {
  fileId: string;
  domainId: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  currentStage?: string;
  progress: number;
  events: ProcessingEvent[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

class SSEService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(event: ProcessingEvent) => void>> = new Map();
  private processingStatus: Map<string, ProcessingStatus> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to SSE endpoint
   */
  async connect(domainId: string): Promise<void> {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Close existing connection
    this.disconnect();

    // Create SSE connection
    const sseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sse-processor?domain_id=${domainId}`;
    
    this.eventSource = new EventSource(sseUrl, {
      withCredentials: true
    });

    // Set up event handlers
    this.eventSource.onopen = () => {
      console.log('SSE connection established');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.handleError(error);
    };

    // Listen for specific event types
    this.eventSource.addEventListener('processing-update', (event: MessageEvent) => {
      this.handleProcessingUpdate(event);
    });

    this.eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      // Keep connection alive
      console.debug('SSE heartbeat received');
    });
  }

  /**
   * Disconnect SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('SSE message received:', data);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }

  /**
   * Handle processing update
   */
  private handleProcessingUpdate(event: MessageEvent): void {
    try {
      const processingEvent: ProcessingEvent = JSON.parse(event.data);
      
      // Update processing status
      const fileId = processingEvent.metadata?.fileId;
      if (fileId) {
        this.updateProcessingStatus(fileId, processingEvent);
      }

      // Notify listeners
      this.notifyListeners(fileId || 'global', processingEvent);
    } catch (error) {
      console.error('Failed to handle processing update:', error);
    }
  }

  /**
   * Update processing status
   */
  private updateProcessingStatus(fileId: string, event: ProcessingEvent): void {
    const currentStatus = this.processingStatus.get(fileId) || {
      fileId,
      domainId: event.metadata?.domainId || '',
      status: 'idle',
      progress: 0,
      events: []
    };

    // Update status based on event type
    switch (event.type) {
      case 'started':
        currentStatus.status = 'processing';
        currentStatus.currentStage = event.stage;
        currentStatus.startedAt = event.timestamp;
        currentStatus.progress = 0;
        break;
      
      case 'progress':
        currentStatus.status = 'processing';
        currentStatus.currentStage = event.stage;
        currentStatus.progress = event.progress || 0;
        break;
      
      case 'completed':
        currentStatus.status = 'completed';
        currentStatus.completedAt = event.timestamp;
        currentStatus.progress = 100;
        break;
      
      case 'error':
        currentStatus.status = 'error';
        currentStatus.error = event.message;
        break;
    }

    // Add event to history
    currentStatus.events.push(event);

    // Store updated status
    this.processingStatus.set(fileId, currentStatus);
  }

  /**
   * Handle connection error
   */
  private handleError(error: Event): void {
    if (this.eventSource?.readyState === EventSource.CLOSED) {
      console.log('SSE connection closed, attempting reconnect...');
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}...`);
      // Reconnect logic would go here
      // You'd need to store the domainId to reconnect
    }, delay);
  }

  /**
   * Subscribe to processing events
   */
  subscribe(fileId: string, callback: (event: ProcessingEvent) => void): () => void {
    if (!this.listeners.has(fileId)) {
      this.listeners.set(fileId, new Set());
    }
    
    this.listeners.get(fileId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(fileId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(fileId);
        }
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(fileId: string, event: ProcessingEvent): void {
    // Notify specific file listeners
    const fileListeners = this.listeners.get(fileId);
    if (fileListeners) {
      fileListeners.forEach(callback => callback(event));
    }

    // Notify global listeners
    const globalListeners = this.listeners.get('global');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(event));
    }
  }

  /**
   * Get processing status
   */
  getStatus(fileId: string): ProcessingStatus | undefined {
    return this.processingStatus.get(fileId);
  }

  /**
   * Get all processing statuses
   */
  getAllStatuses(): ProcessingStatus[] {
    return Array.from(this.processingStatus.values());
  }

  /**
   * Clear completed/error statuses
   */
  clearStatus(fileId: string): void {
    this.processingStatus.delete(fileId);
  }

  /**
   * Simulate processing events (for testing)
   */
  simulateProcessing(fileId: string, domainId: string): void {
    const stages: ProcessingEvent['stage'][] = [
      'chunking',
      'concept-identification',
      'structuring',
      'goal-generation',
      'exercise-generation'
    ];

    let currentStageIndex = 0;
    let progress = 0;

    // Start processing
    this.handleProcessingUpdate({
      data: JSON.stringify({
        id: `${fileId}-1`,
        type: 'started',
        stage: stages[0],
        message: 'Processing started',
        metadata: { fileId, domainId },
        timestamp: new Date().toISOString()
      })
    } as MessageEvent);

    // Simulate progress
    const interval = setInterval(() => {
      progress += 10;

      if (progress >= 100) {
        // Move to next stage
        if (currentStageIndex < stages.length - 1) {
          currentStageIndex++;
          progress = 0;

          this.handleProcessingUpdate({
            data: JSON.stringify({
              id: `${fileId}-${currentStageIndex + 1}`,
              type: 'progress',
              stage: stages[currentStageIndex],
              message: `Processing ${stages[currentStageIndex]}...`,
              progress: 0,
              metadata: { fileId, domainId },
              timestamp: new Date().toISOString()
            })
          } as MessageEvent);
        } else {
          // Complete processing
          clearInterval(interval);
          
          this.handleProcessingUpdate({
            data: JSON.stringify({
              id: `${fileId}-complete`,
              type: 'completed',
              stage: stages[currentStageIndex],
              message: 'Processing completed successfully',
              progress: 100,
              metadata: { fileId, domainId },
              timestamp: new Date().toISOString()
            })
          } as MessageEvent);
        }
      } else {
        // Update progress
        this.handleProcessingUpdate({
          data: JSON.stringify({
            id: `${fileId}-progress-${progress}`,
            type: 'progress',
            stage: stages[currentStageIndex],
            message: `Processing ${stages[currentStageIndex]}...`,
            progress,
            metadata: { fileId, domainId },
            timestamp: new Date().toISOString()
          })
        } as MessageEvent);
      }
    }, 500);
  }
}

// Export singleton instance
export const sseService = new SSEService();