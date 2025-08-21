# Muuttokone Directus Setup

This script creates all necessary collections and seeds them with beautiful mock data for your moving company website.

## Prerequisites

1. Ensure Directus is running via Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Get your Directus static token:
   - Open http://localhost:8055
   - Go to Settings → Project Settings → API
   - Copy the Static Token

## Usage

### Set Environment Variable
```bash
# Windows PowerShell
$env:DIRECTUS_STATIC_TOKEN="your_token_here"

# Linux/Mac
export DIRECTUS_STATIC_TOKEN="your_token_here"
```

### Run Setup Script
```bash
node scripts/setup-directus.mjs
```

## What Gets Created

### Collections
- **services** - Your moving service offerings (6 beautiful services)
- **testimonials** - Customer reviews (5 authentic testimonials) 
- **leads** - Quote requests from your website
- **contacts** - Contact form submissions

### Services Data
The script seeds your services collection with:

1. **Kotimuutot** - Home moves (€89/h, featured)
2. **Yritysmuutot** - Business moves (€95/h, featured)  
3. **Pakkauspalvelu** - Packing service (€45/h, featured)
4. **Varastointi** - Storage (€12/m³/month)
5. **Kansainväliset muutot** - International moves (€2500 estimate)
6. **Piano- ja taidesiirrot** - Specialty moves (€150/item)

### Testimonials Data
Authentic Finnish customer reviews with 5-star ratings from satisfied customers including both individuals and businesses.

## Configuration

The script automatically:
- Creates proper field types and interfaces
- Sets up status workflows (draft/published/archived)
- Configures featured flags for homepage highlighting  
- Adds proper validation and required fields
- Sets up sorting and display options

## Troubleshooting

- **Connection failed**: Ensure Docker Compose is running and Directus is accessible
- **Auth failed**: Double-check your DIRECTUS_STATIC_TOKEN
- **Already exists errors**: Safe to ignore - script detects existing data

## Next Steps

After running the script:
1. Visit http://localhost:8055 to see your data
2. Customize services and testimonials as needed
3. Update your frontend components to use the seeded data
4. Test your quote and contact forms

Your Directus instance is now ready for production! 🚀
