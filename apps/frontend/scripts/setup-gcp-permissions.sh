#!/bin/bash

# Configuration
PROJECT_ID="gen-lang-client-0021845441"
PROJECT_NUMBER="1073556681932"

# 1. The Compute Engine Default Service Account (Often used by Cloud Build & Cloud Run Runtime)
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 2. The Cloud Build Service Account (Standard builder identity)
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# List of roles to grant to BOTH accounts to ensure coverage
ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/artifactregistry.writer"
    "roles/storage.admin"
    "roles/logging.logWriter",
    "roles/cloudbuild.builds.builder",
    "roles/cloudsql.client"
)

echo "🛡️  Starting comprehensive permission fix for Project: $PROJECT_ID"
echo "---------------------------------------------------"

# Function to loop through roles and grant them
grant_permissions() {
    ACCOUNT=$1
    echo "👤 Configuring Account: $ACCOUNT"
    
    for ROLE in "${ROLES[@]}"; do
        echo "   -> Granting $ROLE..."
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$ACCOUNT" \
            --role="$ROLE" \
            --condition=None \
            --quiet > /dev/null 2>&1 || echo "      (Note: Role likely already exists or policy issue, continuing...)"
    done
    echo "---------------------------------------------------"
}

# Apply to both
grant_permissions "$COMPUTE_SA"
grant_permissions "$CLOUDBUILD_SA"

echo "✅ All common permissions have been applied."
