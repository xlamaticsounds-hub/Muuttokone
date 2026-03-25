# Muuttokone.fi Replication Guide

This guide provides step-by-step instructions for replicating the Muuttokone.fi project build and deployment setup for a new client or environment.

## 1. Technology Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Infrastructure**: Google Cloud Platform (Cloud Run, Cloud Build, Artifact Registry)
- **Package Manager**: pnpm

## 2. Prerequisites

Ensure the following tools are installed on your development machine:

- **Node.js** (v20 or higher)
- **pnpm** (Package manager)
- **pnpm dev** (For running the development server)
- **Google Cloud CLI (`gcloud`)** (For deployment)
- **PostgreSQL** (Use cloud sql GCP)

## 3. Local Development Setup

### 3.1. Create the Repository
```bash
npx create-next-app
cd next-app
git init
git remote add origin <repository_url>
git commit -m "Initial commit"
git push --set-upstream origin main
```

### 3.2. Install Dependencies
```bash
pnpm install
```
```
You might need to install pnpm globally if you haven't already:
```bash
npm install -g pnpm
```

### 3.3. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`.

```bash
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL`: Connection string for your PostgreSQL database.
- `NEXTAUTH_SECRET`: Random string for session encryption (generate with `openssl rand -base64 32`).
- `NEXTAUTH_URL`: URL of the site (e.g., `http://localhost:3000` for local).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth (if used).
- `GOOGLE_GENERATIVE_AI_API_KEY`: API key for AI features.

### 3.4. Database Setup
Run the Prisma migrations to set up the database schema:

```bash
pnpm prisma migrate dev
```

(Optional) Seed the database with initial data:
```bash
pnpm prisma db seed
```

### 3.5. Run the Application
Start the development server:

```bash
pnpm dev
```
The app will be available at `http://localhost:3000`.

## 4. Infrastructure Setup (Google Cloud Platform)

This project uses GCP for hosting. You can automate the setup using the provided script or do it manually.

### 4.1. Automated Setup
Run the setup script located in `scripts/`:

```bash
./scripts/gcp-setup.sh
```
*Note: You may need to edit the `PROJECT_ID` and `REGION` variables inside the script before running.*

### 4.2. Manual Setup Steps
1.  **Create a GCP Project**: Go to the Google Cloud Console and create a new project.
2.  **Enable APIs**:
    - Cloud Build API
    - Cloud Run API
    - Artifact Registry API
3.  **Create Artifact Registry**:
    - Name: `muuttokone-repo` (or similar)
    - Format: Docker
    - Region: `europe-north1` (or your preferred region)

## 5. Deployment

The project includes a `deploy.sh` script that handles building and deploying to Cloud Run via Cloud Build.

### 5.1. Configure Deployment
Ensure your `deploy.sh` and `cloudbuild.yaml` match your GCP project settings.
- **`cloudbuild.yaml`**: Defines the build steps (Kaniko build -> Push to Artifact Registry -> Deploy to Cloud Run).
- **`deploy.sh`**: Submits the build to Cloud Build.

### 5.2. Run Deployment
```bash
./deploy.sh
```

This script will:
1.  Read local `.env` variables (specifically `NEXT_PUBLIC_*` vars needed at build time).
2.  Submit a build job to Google Cloud Build.
3.  Build the Docker image.
4.  Push the image to Artifact Registry.
5.  Deploy the new image to Cloud Run.

## 6. Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. |
| `NEXTAUTH_URL` | Canonical URL of the site. |
| `NEXTAUTH_SECRET` | Secret key for signing session tokens. |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret. |
| `ALLOWED_EMAILS` | Comma-separated list of emails allowed to access admin areas. |
| `DISCORD_WEBHOOK_URL` | Webhook URL for sending lead notifications to Discord. |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID. |
| `NEXT_PUBLIC_BASE_URL` | Public base URL (client-side). |
| `SITE_URL` | Public URL for SEO metadata. |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console verification token. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key for Gemini/AI features. |

## 7. Maintenance & Updates

### Database Migrations
When the `prisma/schema.prisma` file is modified, create a new migration:

```bash
pnpm prisma migrate dev --name <migration_name>
```

### Updating Dependencies
```bash
pnpm update
```
