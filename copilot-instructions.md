# Muuttokone.fi Development Guide

## Architecture Overview

This is a **Finnish moving company website** built with Next.js App Router, featuring a modular component system and CMS integration. The site converts template components for moving services with Finnish content.

### Key Structural Patterns

**App Router Structure:**
- `src/app/(site)/` - Main website pages 
- `src/app/(studio)/` - Sanity CMS admin (if enabled)
- `src/app/api/` - API routes for forms, auth, webhooks

**Component Architecture:**
- `src/components/[Feature]/` - Self-contained feature modules (e.g., `HeroArea/`, `Services/`)
- Each component directory contains: `index.tsx` (main), data files (`*Data.tsx`), and sub-components
- Components use `SlideOnReveal` wrapper for animations

**Integration Toggle System:**
The `integrations.config.tsx` controls feature availability:
```tsx
const integrations = {
  isSanityEnabled: true,
  isStripeEnabled: false,
  isAuthEnabled: true
};
```

## Development Workflow

**Essential Commands:**
```bash
npm run dev --turbopack  # Development with Turbo. Use this primarily
npm run build           # Build (includes Prisma generate)
npm run stripe:listen   # Stripe webhook listener
```

**Database Management:**
- Uses Prisma with PostgreSQL which is self-hosted on docker-compose
- Always run `prisma generate` before build
- NextAuth integration via PrismaAdapter

## Moving Company Specific Patterns

**Content Structure:**
- **Hero**: Dynamic typing animation for services (`kotimuutossa`, `yritysmuutossa`)
- **Services**: 8-card grid (Kotimuutto, Yritysmuutto, Pakkaus, Varastointi, Siivous, Piano, IT-muutto, SER-romun keräys)
- **Trust Elements**: SmallFeatures shows credibility (4.9/5 rating, SMPY certification)
- **CTAs**: Primary = "Pyydä tarjous", Secondary = phone number

**Form Architecture:**
- `QuickQuote.tsx` - Homepage mini-form (5 fields)
- Multi-step quote funnel: `/pyyda-tarjous` (Step 1 → Step 2)
- Form data flows: localStorage → API route → Directus

## Critical File Relationships

**Component Data Pattern:**
```tsx
// Component loads data from separate file
import serviceData from "./serviceData";
// Data follows type definitions
const serviceData: Service[] = [...];
```

**Authentication Flow:**
- NextAuth. Not used but can be integrated later
- Zod validation for forms
- Custom error handling with react-hot-toast

## Styling Conventions

**Tailwind v4 Setup:**
- `@tailwindcss/postcss` plugin configuration  
- Custom color classes: `bg-primary`, `text-primary`, `bg-secondary`
- Responsive patterns: `lg:py-25`, `xl:text-title-xl`
- Dark mode: `dark:bg-black`, `dark:text-white`

**Animation Pattern:**
- Components wrapped in `<SlideOnReveal delay={0.3}>`
- CSS classes: `animate_left`, `animate_right`, `animate_top`

## Finnish Localization Notes

**Content Patterns:**
- All user-facing text in Finnish
- Phone format: `+358 40 123 4567`
- Address format: Postal code + city (`00100 Helsinki`)

**SEO Structure:**
- Finnish URLs: `/tarjouspyynto`, `/kotimuutto`  
- Meta descriptions must be concise and include relevant keywords.

## Development Anti-Patterns

- Don't bypass integration toggles - always check `integrations.isXEnabled`
- Don't hardcode phone numbers - extract to constants
- Don't break the component/data separation pattern
- Don't add animations without `SlideOnReveal` wrapper
- Don't forget Prisma generate in build pipeline
