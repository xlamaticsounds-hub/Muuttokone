This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Quick start (development)

Open a PowerShell (Windows) or your shell of choice and run:

```powershell
npm install
npm run dev -- --turbo
```

Then open http://localhost:3000.

Edit `src/app/(site)/page.tsx` and the page will auto-refresh.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# Installing and Configuring Next.js Boilerplate Templates

Installing boilerplate templates are different than ordinary templates, you have to follow the steps strictly without skipping any of them.

1. [Installation](https://nextjstemplates.com/docs/boilerplate#installation)
2. [Databases Setup](https://nextjstemplates.com/docs/database)
3. [Authentication](https://nextjstemplates.com/docs/authentication)
4. [Sanity Integration](https://nextjstemplates.com/docs/sanity)
5. [Markdown Integration](https://nextjstemplates.com/docs/markdown)
6. [Stripe Integration](https://nextjstemplates.com/docs/stripe)
7. [Algolia Integration](https://nextjstemplates.com/docs/algolia)
8. [MailChimp Integration](https://nextjstemplates.com/docs/mailchimp)
9. [SMTP Configuration](https://nextjstemplates.com/docs/resend)

---

### Useful links

- Project guide: `guide.md`
- Backlog & vision: `muuttokone_vision.md`
- Tasks: `tasks.md`

External resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Templates support](https://nextjstemplates.com/support)

### Local setup notes

1. Install dependencies:

```powershell
npm install
```

2. Start the dev server (recommended with Turbopack during development):

```powershell
npm run dev -- --turbo
```

3. Build for production (will run Prisma generate if present):

```powershell
npm run build
```

### Deploying on PaaS

If you are using a GitHub repo then you can go with free-of-cost and easy-to-use options like [Vercel](https://vercel.com/), or [Netlify](https://netlify.com/) they offer decent-free tiers for Next.js hosting.

Make sure to edit build command like this when deploying to Vercel.

![prisma-vercel](https://nextjstemplates.com/docs/prisma-vercel.png)

Follow the steps below to complete the installation, if you get stuck feel free to open a [support ticket](/support), we will get back to you ASAP.

### Update Log

April 10 2025

- Fix peer deps issue and package update
- Migrated to tailwind v4
- Migrate react-instantsearch-dom to react-instantsearch
- Update markups for blog cards
- Using tailwind typography plugin for blog styling
- Font optimization using next/font, include missing typescript types and fix any visible errors.

November 27 2024

- Upgraded to Next.js 15

Oct 30 2024

- Integrated zod for Form validation
- Added integrations enable/disable features
- Added Stripe webhook endpoint
