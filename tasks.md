# Pending Tasks

- enable RLS and use the service key for security

is there something in vercel like @amplify.yml you see here. so that it can load the .env while building. cause the env values are present

- make the rounded elements less rounded. apply to all elements 
- get a xendit account
- clean up front end console.logs for prod

===== COMPLETED TASKS ======

✅ **User Registration ID Generation Fix**: Fixed user registration failing with "null value in column 'id' violates not-null constraint" error. Root cause was missing ID generation in Supabase create methods. Added crypto.randomUUID() generation for User, Product, File, FileDownload, Variation, Purchase, and PasswordReset tables. Also added automatic verification token generation (crypto.randomBytes) with 24-hour expiry for user email verification during registration.

✅ **Email Button Colors Update**: Updated all email template button colors from emerald green (#10b981) to Claude's signature orange (#ff6b35) to match the design system. Also updated button border-radius from 9999px to 16px for consistency with the less-rounded design preference. Affects verification email, password reset email, and purchase confirmation email templates.

✅ **Build Success**: App successfully builds with zero errors after complete Supabase migration (fixed email import issue)

✅ **Sales Page Design Update**: Updated sales page design to match consistent design language across the app - using claude-card styling, emerald/stone color scheme, proper typography (font-light), and consistent spacing/layout patterns

✅ **Products Page API Fix**: Fixed "products.map is not a function" error by correcting data handling - API returns {products: []} but frontend expected array directly. Added defensive programming with Array.isArray checks.

✅ **Products Page Design & Middleware Fix**: Updated products page styling to match design language (claude-card, consistent colors/typography). Fixed middleware bug where /products was incorrectly treated as public route due to /p/* wildcard match.

✅ **Promos Page Design Update**: Updated promos/discount codes page styling to match design language - claude-card for containers, consistent primary/secondary color scheme (replacing hardcoded emerald/blue colors), font-light typography, rounded-2xl buttons, improved skeleton loading states, and consistent table styling with proper hover states and semantic badge colors.

✅ **Customers Page Design Update**: Updated customers page styling to match design language - claude-card for containers, consistent primary color scheme (replacing hardcoded emerald/stone colors), font-light typography, improved skeleton loading states with customer-specific placeholders, semantic color tokens for text hierarchy, and consistent table styling with proper hover states.

✅ **Create Product Page Design Update**: Updated create-product page styling to match design language - CreateProductHeader uses semantic color tokens (bg-background/80, text-foreground, border-border), ProductCreationForm wrapped in claude-card with consistent button styling (rounded-2xl font-light), tab navigation updated with proper hover states, success state improved with semantic colors, and mobile UI enhanced with consistent styling patterns.

