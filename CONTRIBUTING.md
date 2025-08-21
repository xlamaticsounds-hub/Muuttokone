# Contributing to Muuttokone

This document outlines the development standards, patterns, and best practices for the Muuttokone moving company website.

## 🏗️ Architecture Overview

- **Framework**: Next.js 15.5.0 with App Router
- **Language**: TypeScript (strict mode)
- **CMS**: Directus (headless CMS)
- **Database**: PostgreSQL (via Directus)
- **Styling**: TailwindCSS
- **Forms**: Server Actions + Directus API
- **Validation**: Zod schemas
- **Caching**: Next.js unstable_cache with Directus integration

## 📁 Project Structure

```
apps/frontend/src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes (unified submission)
│   ├── (site)/       # Page routes
│   └── layout.tsx      # Root layout with SEO
├── components/         # Reusable UI components
│   ├── SEO/           # SEO-specific components
│   ├── forms/         # Form components
│   └── ui/            # Base UI components
├── lib/               # Utilities and configurations
│   ├── directus.ts    # Directus client (server-only)
│   └── utils.ts       # General utilities
├── types/             # TypeScript definitions
│   └── directus.ts    # Directus collection types
└── utils/             # Helper functions
```

## 🔧 Development Rules

### 1. Server-Only Operations

**Rule**: All Directus operations must be server-side only.

```typescript
// ✅ Correct - server-only import
import 'server-only';
import { directus } from '@/lib/directus';

// ❌ Wrong - client-side Directus operations
import { directus } from '@/lib/directus'; // in a client component
```

### 2. Unified API Pattern

**Rule**: Use the unified `/api/submit` endpoint for all form submissions.

```typescript
// ✅ Correct - unified submission
const response = await fetch('/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'newsletter', // or 'lead'
    data: formData
  })
});

// ❌ Wrong - multiple endpoints
await fetch('/api/newsletter', { ... });
await fetch('/api/contact', { ... });
```

### 3. Type Safety

**Rule**: Use TypeScript types from `/src/types/directus.ts` for all Directus operations.

```typescript
// ✅ Correct
import { Lead, NewsletterSubmission } from '@/types/directus';

function submitLead(data: LeadSubmission) {
  // Type-safe submission
}

// ❌ Wrong
function submitLead(data: any) {
  // No type safety
}
```

### 4. Form Validation

**Rule**: Use Zod schemas for all form validation.

```typescript
// ✅ Correct
import { z } from 'zod';

const LeadSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10)
});

// ❌ Wrong
if (!formData.email.includes('@')) {
  // Manual validation
}
```

### 5. SEO Standards

**Rule**: Every page must have proper metadata and structured data.

```typescript
// ✅ Correct - in page.tsx
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
};

export default function Page() {
  return (
    <>
      <StructuredData type="WebPage" data={pageData} />
      {/* Page content */}
    </>
  );
}
```

### 6. Cache Management

**Rule**: Use Next.js cache with proper tagging for Directus content.

```typescript
// ✅ Correct
export const getCachedLeads = unstable_cache(
  async () => getItems<Lead>('leads'),
  ['leads'],
  { 
    tags: ['collection:leads'],
    revalidate: 3600 
  }
);

// After mutations
revalidateTag('collection:leads');
```

### 7. Environment Variables

**Rule**: Use proper environment variable patterns.

```typescript
// Server-side URLs
const DIRECTUS_URL = process.env.DIRECTUS_URL; // Internal URL (Docker network)

// Client-side URLs (with NEXT_PUBLIC_ prefix)
const PUBLIC_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL; // Public URL
```

## 🎨 Component Patterns

### Form Components

```typescript
// ✅ Standard form component pattern
'use client';
import { useState } from 'react';
import { ApiResponse } from '@/types/directus';

export function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          data: { email }
        })
      });
      
      const result: ApiResponse = await response.json();
      setMessage(result.message);
    } catch (error) {
      setMessage('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Server Components for Content

```typescript
// ✅ Server component for Directus content
import { getCachedItems } from '@/lib/directus';
import { Service } from '@/types/directus';

export default async function ServicesPage() {
  const services = await getCachedItems<Service>('services', {
    filter: { status: { _eq: 'published' } },
    sort: ['sort']
  });

  return (
    <div>
      {services.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
```

## 🗃️ Database Guidelines

### Collection Naming

- Use snake_case for collection names
- Use descriptive, plural names
- Include status fields for content management

### Field Standards

- Always include audit fields: `date_created`, `date_updated`, `user_created`, `user_updated`
- Use enums for predefined options
- Include UTM tracking fields for marketing attribution
- Use consistent field types across collections

### Permissions

- Public role: Create access for submissions, Read access for published content
- Admin role: Full CRUD access
- Editor role: CRUD on own items
- Use field-level permissions for sensitive data

## 🚀 Deployment Guidelines

### Environment Setup

1. **Development**: Local Directus instance + Next.js dev server
2. **Staging**: Docker Compose setup with persistent volumes
3. **Production**: Separate Directus instance + Vercel/production hosting

### Required Environment Variables

```bash
# Development
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_dev_token
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055

# Production
DIRECTUS_URL=https://cms.yourdomain.com
DIRECTUS_TOKEN=your_production_token
NEXT_PUBLIC_DIRECTUS_URL=https://cms.yourdomain.com
```

### Pre-deployment Checklist

- [x] All forms use unified API endpoint  // Implemented: unified `/api/submit` created in `src/app/api/submit/route.ts`
- [x] SEO metadata configured for all pages  // Implemented: global metadata + structured data helpers in the repo; verify page-level overrides as needed
- [x] Proper caching strategies implemented  // Implemented: `unstable_cache` helpers and cache invalidation (`revalidateTag`) for Directus content
- [x] Environment variables configured  // Documented in repo (`docs/directus-schema.md`) and examples in CONTRIBUTING; add `.env` in deployment
- [ ] Directus collections and permissions set up  // Schema and setup docs added (`docs/directus-schema.md`) — actual Directus instance configuration pending
- [ ] File upload permissions configured  // Upload helpers exist, but Directus file storage & permissions must be configured in the CMS
- [x] Error handling implemented  // API and Directus helpers include try/catch and error messages
- [ ] TypeScript strict mode passes  // Not verified from this run; please run the type checks locally or in CI
- [ ] Build process completes without errors  // Not verified here; run `pnpm build`/`npm run build` in CI or locally to confirm

## 🧪 Testing Standards

### API Testing

```typescript
// Test the unified submission endpoint
describe('/api/submit', () => {
  it('should accept newsletter submissions', async () => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'newsletter',
        data: { email: 'test@example.com' }
      })
    });
    
    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
  });
});
```

### Component Testing

```typescript
// Test form components
import { render, fireEvent } from '@testing-library/react';
import { NewsletterForm } from '@/components/forms/NewsletterForm';

test('newsletter form submission', async () => {
  const { getByLabelText, getByText } = render(<NewsletterForm />);
  
  fireEvent.change(getByLabelText(/email/i), { 
    target: { value: 'test@example.com' } 
  });
  fireEvent.click(getByText(/subscribe/i));
  
  // Assert form behavior
});
```

## 📈 Performance Guidelines

### Caching Strategy

1. **Static Content**: Build-time generation for pages
2. **Dynamic Content**: ISR with 1-hour revalidation
3. **User Submissions**: No caching, direct API calls
4. **Assets**: CDN caching for images and files

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image';
import { assetUrl } from '@/lib/directus';

<Image
  src={assetUrl(service.featured_image, { width: 800, height: 400 })}
  alt={service.title}
  width={800}
  height={400}
/>
```

## 🔍 SEO Requirements

### Metadata

Every page must include:
- Unique title (under 60 characters)
- Meta description (under 160 characters)
- Open Graph tags
- Structured data (Schema.org)

### Content Structure

- Use semantic HTML5 elements
- Include proper heading hierarchy (h1 → h6)
- Add alt text for all images
- Include internal linking strategy

## 🐛 Error Handling

### API Errors

```typescript
// ✅ Proper error handling
try {
  const result = await submitNewsletter(data);
  return { success: true, data: result };
} catch (error) {
  console.error('Newsletter submission error:', error);
  return { 
    success: false, 
    message: 'Subscription failed. Please try again.' 
  };
}
```

### User-Facing Errors

- Always provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry mechanisms for transient failures
- Show loading states during submissions

## 💡 Code Quality

### ESLint Configuration

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-const": "error"
  }
}
```

### Git Workflow

1. Create feature branches from `main`
2. Use descriptive commit messages
3. Run tests before pushing
4. Create pull requests for review
5. Squash commits when merging

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Server-only operations are marked correctly
- [ ] Forms use unified API endpoint
- [ ] SEO metadata is included
- [ ] Error handling is implemented
- [ ] Caching strategies are appropriate
- [ ] Performance considerations are addressed

## 📚 Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Directus API Reference](https://docs.directus.io/reference/)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Zod Validation Library](https://zod.dev/)

## 🆘 Getting Help

1. Check existing documentation
2. Review similar patterns in the codebase
3. Test changes locally with Docker Compose
4. Ask questions in team communication channels

Remember: **Quality over speed**. Following these patterns ensures maintainable, scalable, and performant code.
