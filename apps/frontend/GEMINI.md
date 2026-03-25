# Muuttokone.fi Project Documentation

## 🏗 Project Architecture
Muuttokone is a modern moving service platform built with **Next.js 16 (App Router)**. It features a public-facing service site and a secure administrative dashboard (`/hallinta`) for managing leads, deals, and content.

### Core Tech Stack
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Next.js Server Actions & API Routes, Node.js.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: NextAuth.js v4 (Google OAuth + Email Allowlist).
- **AI Integration**: AI SDK (OpenAI gpt-4o-mini) for customer assistance and content generation.
- **Deployment**: Dockerized, running on GCP Cloud Run with Cloud Build CI/CD.

---

## 📂 Project Structure
- `src/app`: Next.js App Router (Site, Admin, and API).
- `src/features`: Modular business logic (Calculator, Quote, Contact).
- `src/components`: Reusable UI components.
- `src/server`: Server-only logic (Auth, DB client, Repositories).
- `src/lib`: Shared utilities and Zod schemas.
- `prisma`: Database schema and migrations.
- `Bloggen`: Python-based blog automation tools.

---

## 📊 Data Models (Prisma)
- **Contact**: Stores customer information (Name, Email, Phone, Address).
- **Lead**: Tracks move requests (Status, Source, Volume, Dates, Addresses).
- **Log**: Audit trail for system actions (Lead creation, Updates).
- **Post/Category/Tag**: Content management for the blog.

---

## 🔌 API Endpoints
- `POST /api/submit`: Unified endpoint for Lead, Booking, and Newsletter submissions.
- `POST /api/chat`: AI Chat assistant using OpenAI.
- `POST /api/ai/*`: Content generation pipeline (Drafts, Outlines, SEO).
- `GET /api/health`: System health status.

---

## 🔐 Authentication Flow
- **Provider**: Google OAuth.
- **Authorization**: Hardcoded admin email + `ALLOWED_EMAILS` environment variable.
- **Session**: Managed via secure `next-auth` cookies.
- **Admin Access**: Middleware and Layout-level checks protect `/hallinta`.

---

## 🚀 CI/CD & Deployment
- **Deployment Script**: `./deploy.sh` (wraps gcloud builds).
- **Config**: `cloudbuild.yaml` handles Docker build and Cloud Run deployment.
- **Secrets**: Managed via environment variables in Cloud Run (Database URL, API Keys).

---

## 🛠 Maintenance & Scripts
- `pnpm dev`: Local development.
- `pnpm build`: Production build (includes Prisma generation).
- `./migrate.sh`: Runs Prisma migrations.
- `Bloggen/generate.py`: AI-powered blog post generation.
