# Preprocessor Deployment Instructions

## Enhanced Logging Implementation

The preprocessor has been updated with comprehensive logging that tracks:

### 1. Database Operations
- **Before Insert**: Logs all columns being inserted
- **After Insert**: Logs the created record with ID
- **Duration**: Tracks operation time in milliseconds
- **Status Transitions**: Logs status changes (pending → processing → completed/failed)

### 2. Pub/Sub Operations
- **Topic Name**: Logs the exact topic being published to
- **Message Payload**: Complete message data in JSON format
- **Message ID**: The Pub/Sub message ID returned
- **Duration**: Publication time in milliseconds

### 3. Processing Metrics
- **File Size**: Size of processed file in bytes
- **Content Type**: Type of content (concept, learning_goal, exercise)
- **Processing Duration**: Total processing time
- **Processing Rate**: MB/sec throughput

## Log Format Examples

### Database Insert Log:
```
DATABASE_INSERT_ATTEMPT: domain_extracted_files - {"domain_id": "uuid", "file_name": "concepts.csv", ...}
DATABASE_INSERT_SUCCESS: Record ID: abc-123, Duration: 45ms
```

### Pub/Sub Publish Log:
```
PUBSUB_PUBLISH_ATTEMPT: Topic: concept-processor-trigger, Record: abc-123
PUBSUB_MESSAGE_PAYLOAD: {"record_id": "abc-123", "domain_id": "uuid", "content_type": "concept", ...}
PUBSUB_PUBLISH_SUCCESS: Topic: concept-processor-trigger, Message ID: 12345, Duration: 120ms
```

### Processing Complete Log:
```json
OPERATION_COMPLETE: {
  "timestamp": "2025-01-17T10:30:00Z",
  "level": "INFO",
  "service": "preprocessor",
  "operation": "file_processing",
  "phase": "COMPLETE",
  "file_id": "abc-123",
  "success": true,
  "total_duration_ms": 1500,
  "summary": {
    "record_created": true,
    "message_published": true,
    "topic": "concept-processor-trigger",
    "duration_ms": 1500
  }
}
```

## Deployment Steps

### 1. Build Docker Image
```bash
cd services/gemeos-preprocessor
docker build -t gcr.io/gemeos-467015/gemeos-preprocessor:latest .
```

### 2. Push to Container Registry
```bash
docker push gcr.io/gemeos-467015/gemeos-preprocessor:latest
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy gemeos-preprocessor \
  --image gcr.io/gemeos-467015/gemeos-preprocessor:latest \
  --platform managed \
  --region europe-west1 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gemeos-467015,SUPABASE_URL=https://jfolpnyipoocflcrachg.supabase.co" \
  --set-secrets="SUPABASE_SERVICE_KEY=supabase-service-key:latest"
```

### 4. Configure Pub/Sub Push Subscription
```bash
# Update the file-processing subscription to push to the new Cloud Run URL
gcloud pubsub subscriptions update file-processing-subscription \
  --push-endpoint=https://gemeos-preprocessor-xxx.run.app/
```

## Environment Variables Required

- `GOOGLE_CLOUD_PROJECT`: gemeos-467015
- `SUPABASE_URL`: https://jfolpnyipoocflcrachg.supabase.co
- `SUPABASE_SERVICE_KEY`: (from Secret Manager)

## Monitoring

### View Logs in Cloud Console:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gemeos-preprocessor" \
  --limit 100 \
  --format json
```

### Filter for Specific Operations:
```bash
# Database operations
gcloud logging read 'jsonPayload.operation="database_update"' --limit 50

# Pub/Sub publishes
gcloud logging read 'jsonPayload.operation="pubsub_publish"' --limit 50

# Errors
gcloud logging read 'severity=ERROR AND resource.labels.service_name=gemeos-preprocessor' --limit 20
```

## Testing

After deployment, test the enhanced logging by:

1. Upload a file via the admin interface
2. Monitor logs in real-time:
   ```bash
   gcloud logging tail "resource.labels.service_name=gemeos-preprocessor"
   ```
3. Verify you see:
   - DATABASE_INSERT_ATTEMPT
   - DATABASE_INSERT_SUCCESS
   - PUBSUB_PUBLISH_ATTEMPT
   - PUBSUB_MESSAGE_PAYLOAD
   - PUBSUB_PUBLISH_SUCCESS
   - OPERATION_COMPLETE

## Rollback

If issues occur, rollback to previous version:
```bash
gcloud run services update-traffic gemeos-preprocessor --to-revisions=PREVIOUS_REVISION_ID=100
```