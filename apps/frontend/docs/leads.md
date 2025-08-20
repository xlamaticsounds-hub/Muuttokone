# Leads collection (Directus) and API

Create a Directus collection `leads` with fields matching the payload used by `/api/quote`:

- name (string, required)
- email (string, optional)
- phone (string, optional)
- from (string)
- to (string)
- size (string)
- date (date or string)
- dateFlex (string)
- services (json or tags)
- inventory (text)
- elevator (boolean)
- distance (string)
- notes (text)
- isBusiness (boolean)
- businessId (string)
- contactNotes (text)
- fromExtra (text)
- toExtra (text)
- attachments (many-to-many to directus_files) — optional
- submittedAt (datetime)
- meta (json)

Permissions: assign a static token with create permission on `leads` and upload permission on `files`.

Env needed in Next.js server:

- `DIRECTUS_URL` (e.g., http://directus:8055)
- `DIRECTUS_STATIC_TOKEN` (Directus static token with above perms)

The form posts `multipart/form-data` with a JSON `payload` and optional `images[]`.
