# Run the project locally

This guide starts the development server connected to a development Supabase project.

## Install dependencies

Use Node.js 22, matching the [Dockerfile](../Dockerfile). This guide uses pnpm, as does [amplify.yml](../amplify.yml). The repository includes npm and pnpm lockfiles but does not pin a pnpm version in `package.json`.

```sh
pnpm install
```

The `postinstall` script generates the Prisma client. Regenerate it after schema changes with `pnpm exec prisma generate`.

## Configure the environment

Create `.env` in the repository root with development values:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_DEVELOPMENT_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_DEVELOPMENT_SERVICE_ROLE_KEY
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
DOMAIN=localhost:2222
RESEND_API_KEY=YOUR_DEVELOPMENT_RESEND_KEY
EMAIL_FROM=dotload <no-reply@YOUR_VERIFIED_DOMAIN>
```

Replace every placeholder. Use a database connection that can apply migrations to the same Supabase database the services access. Add Cloudinary configuration before uploading covers and Xendit configuration before testing payments. See the [configuration reference](configuration.md).

[.env.example](../.env.example) contains duplicate `DATABASE_URL` and `EMAIL_FROM` entries, an old port, and a machine-specific uploads path. Do not copy it unchanged. Omit `UPLOADS_DIR` to use `<repository>/uploads`, or set a writable absolute path.

## Apply the schema

Run against your development database:

```sh
pnpm exec prisma migrate dev
```

The [Prisma schema](../prisma/schema.prisma) reads `DATABASE_URL` for both `url` and `directUrl`. Setting `DIRECT_URL` does not change that configuration.

Application services query tables such as `User`, `Product`, and `Purchase` through [lib/supabase-db.ts](../lib/supabase-db.ts). Local PostgreSQL alone does not support these routes. The fallback helper in [lib/database.ts](../lib/database.ts) does not wire local PostgreSQL into those services.

## Start and check the app

```sh
pnpm dev
```

Open [http://localhost:2222](http://localhost:2222). The script is `next dev -p 2222`, without HTTPS. It does not require local certificates.

Register through `/register`, receive the verification email, and log in. [Registration](../app/api/auth/register/route.ts) catches email errors, so account creation alone does not prove delivery. Inspect server logs if verification mail does not arrive.

## Seed disposable data

Use only a disposable development database:

```sh
pnpm seed
```

[The seeder](../scripts/seed-test-data.ts) writes through Prisma and fetches external product images. It stores plaintext sample passwords while login uses bcrypt. Register through the app to test normal login.

## Diagnose startup problems

| Symptom | Check |
| --- | --- |
| Missing Supabase environment variables | Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; [server services](../lib/supabase-db.ts) check them at import time. |
| Error while trimming `JWT_SECRET` | Set the secret before startup; [middleware](../middleware.ts) and [login](../app/api/auth/login/route.ts) read it at module load. |
| Prisma connection failure | Check `DATABASE_URL` and access to the development database. |
| Missing file | Check `UPLOADS_DIR`, filesystem permissions, and `File.path` against [file utilities](../lib/file-utils.ts). |
| Wrong email link host | Set `DOMAIN=localhost:2222`; [email](../lib/email.ts) prepends `http://`. |
