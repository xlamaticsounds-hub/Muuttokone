#!/bin/bash
PROJECT_ID="gen-lang-client-0021845441"
SA_NAME="github-deployer"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "🤖 Creating Service Account for GitHub Actions: $SA_NAME"

# 1. Create SA
gcloud iam service-accounts create $SA_NAME \
    --description="Service account for GitHub Actions deployment" \
    --display-name="GitHub Actions Deployer" || echo "SA might already exist..."

# 2. Grant Permissions (Reusing the roles list from our previous fix)
ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/artifactregistry.writer"
    "roles/storage.admin"
    "roles/logging.logWriter"
    "roles/cloudbuild.builds.builder"
    "roles/cloudsql.client"
)

for ROLE in "${ROLES[@]}"; do
    echo "   -> Granting $ROLE..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$ROLE" \
        --condition=None \
        --quiet > /dev/null 2>&1
done

# 3. Generate Key
KEY_FILE="github-actions-key.json"
if [ -f "$KEY_FILE" ]; then
    echo "🔑 Key file $KEY_FILE already exists. Skipping generation."
else
    echo "🔑 Generating JSON Key..."
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
fi

echo "---------------------------------------------------"
echo "✅ Setup complete."
echo "1. Go to your GitHub Repo -> Settings -> Secrets and variables -> Actions"
echo "2. Add the following Repository Secrets:"
echo ""
echo "   GCP_PROJECT_ID             : $PROJECT_ID"
   GCP_SA_KEY                 : (Copy content of $KEY_FILE)
   DATABASE_URL               : (Your full connection string with socket path)
   CLOUD_SQL_CONNECTION_NAME  : (Your instance connection name)
   DISCORD_WEBHOOK_URL        : (Your discord webhook URL)
echo ""
echo "⚠️  Keep $KEY_FILE private! Delete it after adding to GitHub."
