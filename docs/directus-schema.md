# Directus Collections Schema

This document outlines the required Directus collections for the Muuttokone moving company website. Import this schema into your Directus instance.

## Core Business Collections

### 1. Newsletter Email Addresses (`newsletter_email_addresses`)

**Purpose**: Store newsletter subscriptions and email marketing leads.

**Fields**:
- `id` (UUID, Primary Key)
- `email` (String, Required, Unique)
- `status` (String, Required, Default: "active")
  - Options: "active", "unsubscribed", "bounced"
- `source` (String, Optional) - Where the subscription came from
- `utm_campaign` (String, Optional) - Marketing campaign tracking
- `utm_source` (String, Optional) - Traffic source tracking
- `utm_medium` (String, Optional) - Marketing medium tracking
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-updated)
- `user_created` (User relation, Auto-generated)
- `user_updated` (User relation, Auto-updated)

**Permissions**:
- Public: Create only (for newsletter signups)
- Admin: Full CRUD access
- Marketing: Read and Update access

**Indexes**:
- `email` (unique)
- `status` (for filtering)
- `date_created` (for sorting)

### 2. Leads (`leads`)

**Purpose**: Store contact form submissions and lead generation data.

**Fields**:
- `id` (UUID, Primary Key)
- `email` (String, Required)
- `first_name` (String, Optional)
- `last_name` (String, Optional)
- `phone` (String, Optional)
- `message` (Text, Optional)
- `service_type` (String, Optional)
  - Options: "residential", "commercial", "storage", "packing", "cleaning"
- `moving_date` (Date, Optional)
- `from_location` (String, Optional)
- `to_location` (String, Optional)
- `apartment_size` (String, Optional)
  - Options: "1-room", "2-room", "3-room", "4-room", "5-room", "house", "office"
- `status` (String, Required, Default: "new")
  - Options: "new", "contacted", "qualified", "converted", "closed"
- `source` (String, Optional) - Lead source tracking
- `utm_campaign` (String, Optional) - Marketing campaign tracking
- `utm_source` (String, Optional) - Traffic source tracking
- `utm_medium` (String, Optional) - Marketing medium tracking
- `files` (Files relation, Many-to-Many, Optional) - Uploaded documents/images
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-updated)
- `user_created` (User relation, Auto-generated)
- `user_updated` (User relation, Auto-updated)

**Permissions**:
- Public: Create only (for contact forms)
- Admin: Full CRUD access
- Sales: Read and Update access

**Indexes**:
- `email` (for deduplication)
- `status` (for filtering)
- `date_created` (for sorting)
- `service_type` (for analytics)

## Content Management Collections

### 3. Pages (`pages`)

**Purpose**: Static pages and landing pages.

**Fields**:
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `slug` (String, Required, Unique)
- `content` (Rich Text, Optional)
- `meta_title` (String, Optional, Max: 60)
- `meta_description` (String, Optional, Max: 160)
- `featured_image` (File relation, Optional)
- `status` (String, Required, Default: "draft")
  - Options: "draft", "published", "archived"
- `sort` (Integer, Optional)
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-updated)

**Permissions**:
- Public: Read published only
- Admin: Full CRUD access
- Editor: CRUD on own items

### 4. Services (`services`)

**Purpose**: Moving services offered by the company.

**Fields**:
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `slug` (String, Required, Unique)
- `description` (String, Optional, Max: 200) - Short description
- `long_description` (Rich Text, Optional)
- `price_from` (Integer, Optional) - Price in cents
- `price_to` (Integer, Optional) - Price in cents
- `duration` (String, Optional) - e.g., "2-4 hours"
- `features` (JSON, Optional) - Array of service features
- `icon` (String, Optional) - Icon name or emoji
- `featured_image` (File relation, Optional)
- `gallery` (Files relation, Many-to-Many, Optional)
- `status` (String, Required, Default: "draft")
- `sort` (Integer, Optional)
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-updated)

**Permissions**:
- Public: Read published only
- Admin: Full CRUD access
- Editor: CRUD access

### 5. Testimonials (`testimonials`)

**Purpose**: Customer reviews and testimonials.

**Fields**:
- `id` (UUID, Primary Key)
- `name` (String, Required)
- `location` (String, Optional)
- `rating` (Integer, Required, Min: 1, Max: 5)
- `content` (Text, Required)
- `service_used` (String, Optional)
- `date_of_service` (Date, Optional)
- `avatar` (File relation, Optional)
- `status` (String, Required, Default: "draft")
- `featured` (Boolean, Default: false)
- `sort` (Integer, Optional)
- `date_created` (DateTime, Auto-generated)

**Permissions**:
- Public: Read published only
- Admin: Full CRUD access
- Editor: CRUD access

### 6. FAQs (`faqs`)

**Purpose**: Frequently asked questions.

**Fields**:
- `id` (UUID, Primary Key)
- `question` (String, Required)
- `answer` (Rich Text, Required)
- `category` (String, Optional)
  - Options: "general", "pricing", "booking", "services", "insurance"
- `status` (String, Required, Default: "draft")
- `sort` (Integer, Optional)
- `date_created` (DateTime, Auto-generated)

**Permissions**:
- Public: Read published only
- Admin: Full CRUD access
- Editor: CRUD access

### 7. Blog Posts (`blog_posts`)

**Purpose**: SEO blog content and moving tips.

**Fields**:
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `slug` (String, Required, Unique)
- `excerpt` (String, Optional, Max: 200)
- `content` (Rich Text, Required)
- `featured_image` (File relation, Optional)
- `author` (String, Optional)
- `tags` (JSON, Optional) - Array of tags
- `status` (String, Required, Default: "draft")
- `featured` (Boolean, Default: false)
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-updated)
- `date_published` (DateTime, Optional)
- `meta_title` (String, Optional, Max: 60)
- `meta_description` (String, Optional, Max: 160)

**Permissions**:
- Public: Read published only
- Admin: Full CRUD access
- Editor: CRUD access

## Installation Instructions

### Step 1: Create Collections

1. Go to Settings > Data Model in your Directus admin panel
2. Create each collection using the field specifications above
3. Set appropriate field validation rules and defaults

### Step 2: Set Up Permissions

1. Go to Settings > Roles & Permissions
2. Configure the "Public" role with read access to published content
3. Create "Editor" and "Marketing" roles as needed
4. Set up API access for the public forms

### Step 3: Configure API Access

1. Create a static token for the Next.js application
2. Set the token in your environment variables as `DIRECTUS_TOKEN`
3. Ensure the token has appropriate permissions for:
   - Creating newsletter subscriptions
   - Creating leads
   - Reading published content

### Step 4: Seed Initial Data

Consider adding:
- Basic pages (Home, About, Contact, Services)
- Initial service offerings
- Sample FAQs
- Basic testimonials

### Step 5: File Storage

Configure file storage settings:
- Set up appropriate image transformations
- Configure file access permissions
- Set up CDN if needed (optional)

## Environment Variables

Add these to your `.env.local`:

```bash
# Directus Configuration
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_static_token_here
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
```

For production, update the URLs to your production Directus instance.

## API Usage Examples

### Newsletter Subscription
```typescript
const response = await fetch('/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'newsletter',
    data: { email: 'user@example.com', source: 'homepage' }
  })
});
```

### Lead Submission
```typescript
const response = await fetch('/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'lead',
    data: {
      email: 'user@example.com',
      first_name: 'John',
      message: 'I need help with moving',
      service_type: 'residential'
    }
  })
});
```

## Notes

- All collections include automatic audit fields (created/updated timestamps and users)
- UTM tracking fields are included for marketing attribution
- File uploads are supported for lead submissions
- Schema follows Directus best practices for performance and scalability
