# Configuration reference

Variables below come from inspected repository source. Keep server credentials separate from variables prefixed with `NEXT_PUBLIC_`.

## Database and authentication

| Variable | Consumer and behavior |
| --- | --- |
| `DATABASE_URL` | [Prisma schema](../prisma/schema.prisma) uses it for both the database URL and direct URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | [Server services](../lib/supabase-db.ts) require it at import time. [Client helpers](../lib/supabase.ts) also use it. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server services require it and create an admin Supabase client with it. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client helpers use it. It does not replace the service role key for server services. |
| `JWT_SECRET` | [Middleware](../middleware.ts) and [login](../app/api/auth/login/route.ts) call `.trim()` at module load. Other helpers have fallback strings; configure a secret to avoid inconsistent fallback paths. |
| `COOKIE_DOMAIN` | Optional production cookie domain in [purchase account creation](../app/api/auth/create-from-purchase/route.ts). |
| `LOCAL_DATABASE_URL` | Used by [database configuration helpers](../lib/database.ts), not by the Prisma schema or Supabase services. |
| `DIRECT_URL` | Present in the example; the schema uses `DATABASE_URL` instead. |

## Email and files

| Variable | Consumer and behavior |
| --- | --- |
| `RESEND_API_KEY` | [Email module](../lib/email.ts) creates a Resend client when present. Sending throws when absent. |
| `EMAIL_FROM` | Email sender, defaulting to `alacart <noreply@alacart.store>`. |
| `DOMAIN` | Email URLs use `http://${DOMAIN}`. Use `localhost:2222` without a scheme locally. Production HTTPS links need a code change. |
| `UPLOADS_DIR` | [File utilities](../lib/file-utils.ts) and [download utilities](../lib/download-utils.ts) default to `<process.cwd()>/uploads`. |
| `CLOUDINARY_CLOUD_NAME` | Account configuration in [Cloudinary module](../lib/cloudinary.ts). |
| `CLOUDINARY_API_KEY` | Cloudinary API credential. |
| `CLOUDINARY_API_SECRET` | Cloudinary server credential. |
| `DOWNLOAD_SECRET` | HMAC secret in [download generation](../app/api/downloads/secure/generate/route.ts) and [delivery](../app/api/downloads/secure/route.ts). Falls back to `JWT_SECRET`, then a literal string. |
| `NEXTAUTH_URL` | Included in secure download token input despite the custom JWT authentication. Generation and validation need the same value. |

AWS SES, SendGrid, Mailgun, and SMTP are not selectable providers in `lib/email.ts`. A dependency or example variable does not establish an implemented provider.

## Payments and fees

| Variable | Consumer and behavior |
| --- | --- |
| `XENDIT_SECRET_KEY` | [Xendit client](../lib/xendit-client.ts) and [SDK initialization](../lib/xendit.ts). |
| `XENDIT_API_KEY` | Read separately by [transaction payout](../app/api/transactions/payout/route.ts). Configuring only the secret key does not configure this handler. |
| `XENDIT_WEBHOOK_SECRET` | [Payment webhook](../app/api/payments/webhook/route.ts) uses it when a callback header is present. See the authentication gap in [operations](operations.md). |
| `PAYOUT_PERCENTAGE_FEE` | [Fee utilities](../lib/fee-utils.ts) default to `0.05`; a configured zero also takes the default because the expression uses `||`. |
| `PAYOUT_FIXED_FEE` | Fee utilities default to `15`, while [fee-config](../app/api/fee-config/route.ts) defaults to `0.30`. |

Trace the consuming module before assuming that other variables in `.env.example` enable a feature.
