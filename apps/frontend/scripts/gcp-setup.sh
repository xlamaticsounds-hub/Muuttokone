#!/bin/bash

# Configuration
# Explicitly setting the project ID found in your console
PROJECT_ID="gen-lang-client-0021845441"
REGION="europe-north1" 
REPO_NAME="muuttokone-repo"
SERVICE_NAME="muuttokone-app"

# 1. Set the active project
echo "🎯 Setting active project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 2. Get DATABASE_URL from your .env file
if [ -f .env ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | sed 's/^"//;s/"$//')
fi

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL not found in .env."
  echo "You will be prompted to enter it manually if needed."
fi

echo "🚀 Enabling necessary Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

# 3. Create Artifact Registry Repository
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for Muuttokone" \
  || echo "Repository might already exist, continuing..."

# 4. Final Instructions
echo ""
echo "✅ Setup complete for $PROJECT_ID!"
echo "Run the following command to build and deploy your application:"
echo ""
echo "gcloud builds submit --config=cloudbuild.yaml \"
echo "  --substitutions=_REGION=$REGION,_REPO_NAME=$REPO_NAME,_SERVICE_NAME=$SERVICE_NAME,_DATABASE_URL='$DATABASE_URL'"
echo ""