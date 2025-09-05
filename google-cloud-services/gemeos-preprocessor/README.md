# GEMEOS Preprocessor Service

## Overview
The GEMEOS Preprocessor is a Cloud Run service that handles file uploads and routes them to domain-specific Google Cloud Storage buckets based on content type.

## Architecture

### Domain-Based Routing
Files are routed to specific GCS buckets based on the domain:
- **jazz-music** → `gemeos-jazz` bucket
- **gmat** → `gemeos-gmat` bucket
- Additional domains can be configured in `DOMAIN_BUCKET_MAPPING`

### Content Type Organization
Within each bucket, files are organized by content type:
- **Concepts**: `{bucket}/concepts/ingestion/`
- **Learning Goals**: `{bucket}/learning-goals/ingestion/`
- **Exercises**: `{bucket}/exercises/ingestion/`

### File Processing Flow
1. File upload notification received (via Pub/Sub or direct API call)
2. Determine target bucket based on domain slug
3. Determine target path based on content type
4. Copy file to appropriate location with metadata
5. Extract file metadata and preview
6. Store record in Supabase database
7. Publish event for downstream processing

## API Endpoints

### Health Check
```
GET /
```
Returns service health status.

### Process Pub/Sub Message
```
POST /
```
Handles Pub/Sub messages for file processing.

Expected message format:
```json
{
  "message": {
    "data": "base64-encoded-json",
    "attributes": {
      "domain_slug": "jazz-music",
      "content_type": "concepts",
      "file_name": "example.pdf",
      "bucket": "source-bucket",
      "object": "path/to/file"
    }
  }
}
```

### Process Direct Upload
```
POST /process
```
Direct API endpoint for file processing.

Request body:
```json
{
  "domain_slug": "jazz-music",
  "content_type": "concepts",
  "file_info": {
    "file_name": "example.pdf",
    "source_bucket": "upload-bucket",
    "source_path": "temp/file.pdf",
    "uploaded_by": "user-id"
  }
}
```

### List Domains
```
GET /domains
```
Returns configured domains and content types.

## Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `GOOGLE_CLOUD_PROJECT`: GCP project ID
- `PORT`: Server port (default: 8080)

## Deployment

### Build and Deploy to Cloud Run

1. Build the container:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/gemeos-preprocessor
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy gemeos-preprocessor \
  --image gcr.io/PROJECT_ID/gemeos-preprocessor \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL="your-url" \
  --set-env-vars SUPABASE_SERVICE_KEY="your-key" \
  --set-env-vars GOOGLE_CLOUD_PROJECT="your-project"
```

### Create Required GCS Buckets

```bash
# Create domain-specific buckets
gsutil mb -l europe-west1 gs://gemeos-jazz
gsutil mb -l europe-west1 gs://gemeos-gmat

# Create folder structure (optional, will be created automatically)
gsutil mkdir gs://gemeos-jazz/concepts/ingestion
gsutil mkdir gs://gemeos-jazz/learning-goals/ingestion
gsutil mkdir gs://gemeos-jazz/exercises/ingestion

gsutil mkdir gs://gemeos-gmat/concepts/ingestion
gsutil mkdir gs://gemeos-gmat/learning-goals/ingestion
gsutil mkdir gs://gemeos-gmat/exercises/ingestion
```

### Set Up Pub/Sub Topics

```bash
# Create topics for downstream processing
gcloud pubsub topics create concepts-processor-trigger
gcloud pubsub topics create learning-goals-processor-trigger
gcloud pubsub topics create exercises-processor-trigger
```

## Database Schema

The service expects the following Supabase tables:
- `domain_concepts_files`
- `domain_learning_goals_files`
- `domain_exercises_files`

Each table should have columns:
- `id` (UUID, primary key)
- `domain_slug` (text)
- `content_type` (text)
- `file_name` (text)
- `gcs_bucket` (text)
- `gcs_path` (text)
- `file_size` (bigint)
- `file_metadata` (jsonb)
- `status` (text)
- `uploaded_by` (text)
- `created_at` (timestamp)

## Development

### Local Testing

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_KEY="your-key"
export GOOGLE_CLOUD_PROJECT="your-project"
```

3. Run the service:
```bash
python main.py
```

### Docker Build and Test

```bash
# Build
docker build -t gemeos-preprocessor .

# Run locally
docker run -p 8080:8080 \
  -e SUPABASE_URL="your-url" \
  -e SUPABASE_SERVICE_KEY="your-key" \
  -e GOOGLE_CLOUD_PROJECT="your-project" \
  gemeos-preprocessor
```

## Adding New Domains

To add support for a new domain:

1. Update `DOMAIN_BUCKET_MAPPING` in `main.py`:
```python
DOMAIN_BUCKET_MAPPING = {
    "jazz-music": "gemeos-jazz",
    "gmat": "gemeos-gmat",
    "new-domain": "gemeos-new-domain"  # Add new mapping
}
```

2. Create the GCS bucket:
```bash
gsutil mb -l europe-west1 gs://gemeos-new-domain
```

3. Redeploy the service.

## Monitoring

### Logs
View service logs:
```bash
gcloud run services logs read gemeos-preprocessor --region europe-west1
```

### Metrics
Monitor in Google Cloud Console:
- Request count
- Request latency
- Error rate
- Container CPU/Memory usage

## Security Considerations

1. **Service Account Permissions**: Ensure the Cloud Run service account has:
   - Storage Object Admin on relevant buckets
   - Pub/Sub Publisher on topics
   
2. **Non-root Container**: The container runs as a non-root user for security.

3. **Environment Variables**: Use Secret Manager for sensitive values in production.

4. **Authentication**: Consider adding authentication for the `/process` endpoint in production.

## Troubleshooting

### Service won't start
- Check environment variables are set correctly
- Verify Supabase credentials
- Check Cloud Run logs for specific errors

### Files not routing correctly
- Verify domain slug matches mapping
- Check GCS bucket exists and has proper permissions
- Review logs for routing decisions

### Database errors
- Ensure tables exist in Supabase
- Verify service key has appropriate permissions
- Check network connectivity to Supabase

## Future Enhancements

- [ ] Add file content extraction for PDFs, Word docs, etc.
- [ ] Implement virus scanning before processing
- [ ] Add support for batch file uploads
- [ ] Implement file deduplication
- [ ] Add progress tracking for large files
- [ ] Support streaming uploads for very large files