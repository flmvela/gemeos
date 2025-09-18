#!/bin/bash

# Deployment script for Gemeos Preprocessor
# This deploys without using Google Secret Manager

echo "Deploying Gemeos Preprocessor to Cloud Run..."

# Set your Supabase service key here (get it from Supabase dashboard)
# IMPORTANT: Don't commit this file with the actual key
SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"

# Check if the key is set
if [ "$SUPABASE_SERVICE_KEY" == "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE" ]; then
    echo "Error: Please set the SUPABASE_SERVICE_KEY in this script before deploying"
    echo "You can find it in the Supabase dashboard under Settings > API"
    exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t gcr.io/gemeos-467015/gemeos-preprocessor:latest .

if [ $? -ne 0 ]; then
    echo "Docker build failed"
    exit 1
fi

# Push to Container Registry
echo "Pushing to Google Container Registry..."
docker push gcr.io/gemeos-467015/gemeos-preprocessor:latest

if [ $? -ne 0 ]; then
    echo "Docker push failed"
    exit 1
fi

# Deploy to Cloud Run with environment variables
echo "Deploying to Cloud Run..."
gcloud run deploy gemeos-preprocessor \
  --image gcr.io/gemeos-467015/gemeos-preprocessor:latest \
  --platform managed \
  --region europe-west1 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gemeos-467015,SUPABASE_URL=https://jfolpnyipoocflcrachg.supabase.co,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY" \
  --allow-unauthenticated

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    echo "The preprocessor is now running with enhanced logging."
    echo ""
    echo "To view logs, run:"
    echo "gcloud logging tail \"resource.labels.service_name=gemeos-preprocessor\""
else
    echo "Deployment failed"
    exit 1
fi