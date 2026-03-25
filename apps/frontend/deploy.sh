#!/bin/bash

# Load local .env variables for NEXT_PUBLIC vars (needed at build time)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Starting build with build-args for NEXT_PUBLIC variables..."

gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=\
_REGION="europe-north1",\
_REPO_NAME="muuttokone",\
_SERVICE_NAME="muuttokone",\
_NEXT_PUBLIC_GA_ID="$NEXT_PUBLIC_GA_ID",\
_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"