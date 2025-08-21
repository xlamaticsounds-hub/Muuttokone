/**
 * BLOAT REMOVAL LOG - COMPLETED ACTIONS
 * 
 * ## COMPLETED REMOVALS:
 * 
 * ### DEAD CODE DELETED:
 * ✅ `/api/quote` route (148 lines) - completely unused, replaced by `/api/submit`
 * ✅ `validateEmail` utility - redundant with Zod validation  
 * ✅ `integrations.config.tsx` - all integrations disabled but still imported (60+ lines)
 * 
 * ### AUTH SYSTEM REMOVED:
 * ✅ All auth pages: `/auth/signin`, `/auth/signup`, `/auth/forget-password`, `/auth/reset-password`
 * ✅ All Auth components: `src/components/Auth/*` (Signin, Signup, ForgetPassword, ResetPassword, Graphics)
 * ✅ All auth API routes: `/api/auth/*`, `/api/register`, `/api/forget-password/*` 
 * ✅ Auth configuration: `src/lib/authOptions.ts`
 * ✅ Auth context: `src/app/context/AuthContext.tsx`
 * ✅ NextAuth SessionProvider removed from providers
 * ✅ Auth UI removed from Header component (signin/signout buttons)
 * ✅ Auth logic removed from `/api` route
 * 
 * ### TEMPLATE POLLUTION FIXED:
 * ✅ Page titles changed from "Base - Next.js Template" to proper Finnish titles
 * ✅ Error page: "404 Error | Base Next.js App Landing Template" → "404 - Sivua ei löydy | Muuttokone.fi"
 * ✅ Auth pages: "Sign In Page | Base - Next.js Template" → "Kirjaudu sisään | Muuttokone.fi"
 * ✅ Signup: "Sign Up Page | Base - Next.js Template" → "Luo tili | Muuttokone.fi"
 * 
 * ## BUILD IMPACT:
 * - Routes reduced from 24 to 17 (7 auth-related routes removed)
 * - Bundle size slightly reduced (102kB shared chunks)
 * - No more auth-related dependencies loaded
 * - Cleaner, business-focused route structure
 * 
 * ## STILL TO ADDRESS:
 * - Console log bloat in production code (8+ files)
 * - Repeated Tailwind classes (100+ char input classes)
 * - Inconsistent spacing patterns (mb-4, mb-4.5, mb-7.5)
 * - Legacy compatibility layers in Directus helpers
 */

export const bloatRemovalCompleted = {
  deletedFiles: [
    'src/app/api/quote/route.ts',
    'src/app/libs/validate.ts',
    'integrations.config.tsx',
    'src/app/(site)/auth/', // entire folder
    'src/components/Auth/', // entire folder 
    'src/app/api/auth/', // entire folder
    'src/app/api/register/',
    'src/app/api/forget-password/',
    'src/lib/authOptions.ts',
    'src/app/context/AuthContext.tsx',
  ],
  updatedFiles: [
    'src/app/(site)/providers.tsx - removed SessionProvider',
    'src/components/Header/index.tsx - removed auth UI',
    'src/app/api/route.ts - removed auth logic',
    'src/app/(site)/*/page.tsx - fixed template titles',
  ],
  routesRemoved: [
    '/auth/signin',
    '/auth/signup', 
    '/auth/forget-password',
    '/auth/reset-password/*',
    '/api/auth/*',
    '/api/register',
    '/api/forget-password/*',
    '/api/quote',
  ]
};
