#!/bin/bash

# Quick deployment script for testing
# Uses environment variables directly (not recommended for production)

echo "Quick deploying Gemeos Preprocessor with enhanced logging..."

# Build and deploy directly without pushing to registry
gcloud run deploy gemeos-preprocessor \
  --source . \
  --platform managed \
  --region europe-west1 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gemeos-467015,SUPABASE_URL=https://jfolpnyipoocflcrachg.supabase.co" \
  --allow-unauthenticated

echo ""
echo "Deployment complete. Now check the logs to see what Pub/Sub is sending:"
echo "gcloud logging tail \"resource.labels.service_name=gemeos-preprocessor\" --format=\"default(timestamp,textPayload)\""