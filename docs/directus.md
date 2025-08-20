# Directus integration guide

This doc explains how the project integrates with Directus and what to set up to edit content (services, brand, configs) from the admin.

## Environment
Set these in `apps/frontend/.env.local`:

- DIRECTUS_URL=http://localhost:8055 (or https://mgmt.muuttokone.fi)
- DIRECTUS_STATIC_TOKEN= (static access token with minimum read permissions)

## Collections to create in Directus

### services
For the Services page.
- title (string, required)
- description (text)
- icon (file, optional)

Frontend: `apps/frontend/src/app/(site)/services/page.tsx` fetches from `/items/services?fields=title,description,icon` and renders via `Services` component.

### configs (key/value)
For site-level settings editable in admin.
- key (string, primary key, unique)
- value (JSON)

Seed recommended keys:
- brand
```
{
  "name": "Muuttokone.fi",
  "logo_light": "<fileId>",
  "logo_dark": "<fileId>"
}
```
- contact
```
{
  "phone": { "display": "+358 50 463 0572", "tel": "+358504630572" },
  "email": "info@muuttokone.fi",
  "openingHours": "Ma-Pe 8:00-18:00, La-Su 9:00-15:00.",
  "social": { "facebook": "#", "twitter": "#", "linkedin": "#", "behance": "#" }
}
```

Optional: `brand_assets` (label, image[file], url, order) for partner logos.

## Roles & Access
- Create roles: Admin (full), Manager (edit CRM/configs), Reader (read-only)
- Issue a Static Access Token for the Reader role; use it in the frontend for server-side reads

## Frontend pieces already in place
- `apps/frontend/src/libs/directus.ts`: tiny REST helper (uses env + static token)
- `apps/frontend/src/app/(site)/services/page.tsx`: fetches services from Directus
- `apps/frontend/next.config.mjs`: allows Directus images (localhost:8055, mgmt.muuttokone.fi)

## Fetching site config (server-side)
Use `getSiteConfig()` to read `brand` and `contact` from Directus with safe fallback to local `src/config/site.ts`.

- File: `apps/frontend/src/libs/siteConfig.server.ts`
- Consumers (server components/layouts) can call it and pass data down to client components.

## Troubleshooting
- Permissions: ensure the static token can read `services`, `configs`, and `files`
- Images not rendering: add Directus host to `next.config.mjs` images.remotePatterns
- CORS: prefer server-side fetches; for client-side, configure CORS in Directus
