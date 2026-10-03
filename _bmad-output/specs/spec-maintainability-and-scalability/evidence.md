# Evidence and research

Baseline: working tree at HEAD `1724245`, reviewed 2026-10-04. The earlier documentation index records its own baseline at `ef07d41`; implementation must recheck source and actual deployed settings. Findings here are source observations and risk assessments, not confirmed exploitation, live configuration findings, passing test results, or capacity measurements.

## Repository evidence

| Capabilities | Observed source behavior | Evidence |
| --- | --- | --- |
| CAP-1 | Callback verification is commented out in one handler; the other verifies only if a token exists and compares it to a body HMAC | [Xendit webhook](../../../app/api/webhooks/xendit/route.ts), [payment webhook](../../../app/api/payments/webhook/route.ts) |
| CAP-2 | Webhooks perform sequential purchase and transaction writes; transaction attribution selects recipient income when IDs differ | [Payment webhook](../../../app/api/payments/webhook/route.ts), [transaction utilities](../../../lib/transaction-utils.ts) |
| CAP-3 | Payout checks a fetched balance before its provider call, records transactions afterward, and generates its key from current time | [Payout handler](../../../app/api/transactions/payout/route.ts), [summary calculations](../../../lib/supabase-db.ts) |
| CAP-4 | Runtime services create an admin client; authorization is distributed; auth debugging logs cookies | [Supabase services](../../../lib/supabase-db.ts), [auth utilities](../../../lib/auth-utils.ts), [middleware](../../../middleware.ts), [architecture](../../../docs/architecture.md) |
| CAP-5 | Monetary fields are `Float`; fee defaults disagree; the fee-update endpoint returns success without persistence or implemented admin checks | [Schema](../../../prisma/schema.prisma), [fee utility](../../../lib/fee-utils.ts), [fee endpoint](../../../app/api/fee-config/route.ts) |
| CAP-6 | Secret handling and connection variables differ between consumers; email builds HTTP links; setup docs report example and seed password issues | [Configuration](../../../docs/configuration.md), [development](../../../docs/development.md), [email](../../../lib/email.ts), [auth helpers](../../../lib/auth-utils.ts) |
| CAP-7 | Supabase serves application queries; Prisma supplies schema/seeding; separate migration locations and an unwired fallback helper coexist | [Architecture](../../../docs/architecture.md), [fallback helper](../../../lib/database.ts), [Prisma migrations](../../../prisma/migrations), [Supabase migrations](../../../supabase/migrations), [standalone SQL](../../../migration.sql) |
| CAP-8 | The common service file combines business areas and accepts unrestricted `any` inputs | [Supabase services](../../../lib/supabase-db.ts), [route inventory](../../../docs/api.md) |
| CAP-9 | Builds suppress type/lint failures; integration tests mock Prisma; Jest maps jose to a mock; documented e2e target is absent | [Next config](../../../next.config.js), [purchase integration test](../../../tests/integration/purchase-flow.test.ts), [Jest config](../../../jest.config.js), [operations](../../../docs/operations.md) |
| CAP-10 | Multiple lockfiles and unpinned pnpm coexist; Docker expects standalone output while config omits it; listener and Compose mapping differ | [Development](../../../docs/development.md), [Dockerfile](../../../Dockerfile), [Compose](../../../docker-compose.yml), [Next config](../../../next.config.js), [Amplify config](../../../amplify.yml) |
| CAP-11 | Product files are buffered and written locally; resolvers try multiple paths and recursive search | [Upload handler](../../../app/api/products/[id]/files/route.ts), [file utilities](../../../lib/file-utils.ts), [download handler](../../../app/api/downloads/secure/route.ts) |
| CAP-12 | Transaction summaries fetch rows and aggregate in JavaScript; schema has no product slug uniqueness or declared query indexes for these histories | [Supabase services](../../../lib/supabase-db.ts), [schema](../../../prisma/schema.prisma), [slug migration](../../../prisma/migrations/20250508034828_add_slug_field/migration.sql) |
| CAP-13 | Webhook handlers perform work inline and catch some email errors without a durable notification retry record | [Payment webhook](../../../app/api/payments/webhook/route.ts), [Xendit webhook](../../../app/api/webhooks/xendit/route.ts) |

Risk inference: separate balance checks and writes permit competing payout requests to observe the same funds; regenerated idempotency keys do not identify retries of one operation; repeated callbacks can repeat unguarded accounting effects. These require concurrency and failure tests, not a claim that a production loss has occurred.

## Official documentation consulted

- [Xendit handling webhooks](https://docs.xendit.co/docs/handling-webhooks): verify callback tokens, expect duplicate and unordered delivery, and acknowledge promptly. W1/W2/W13 add mandatory authentication, duplicate protection, guarded transitions, and durable receipt before asynchronous acknowledgement.
- [Xendit API reference](https://developers.xendit.co/api-reference/?javascript=): retry the same operation with its idempotency key to prevent duplicate operations. W3 must verify the exact `/v2/payouts` contract currently used; newer payout documentation is not automatic authorization for an API-version migration.
- [Next.js 15 data security](https://nextjs.org/docs/15/app/guides/data-security): use server-only data access with authorization and minimal data-transfer objects. Supports W4/W8's proposed boundaries.
- [Next.js 15 TypeScript configuration](https://nextjs.org/docs/15/pages/api-reference/config/typescript): `ignoreBuildErrors` permits production builds despite type errors. Supports W9's enforced type gate.
- [Next.js 15 standalone output](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/output): standalone output generates the minimal deployment server and requires appropriate asset handling. Supports the Docker repair in W10.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): privileged service-role access bypasses RLS when used without a user access token. Supports W4's explicit authorization requirements; custom JWT-to-RLS identity integration remains a design choice.
- [Supabase private storage delivery](https://supabase.com/docs/guides/storage/serving/downloads): private objects support server-generated time-limited URLs or authenticated delivery. Supports W11; the application must still decide entitlement and download counting.
- [PostgreSQL numeric types](https://www.postgresql.org/docs/15/datatype-numeric.html): exact monetary storage/calculation calls for `numeric` rather than floating point. Supports W5's decimal option; integer minor units are the alternative design proposal.
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html): inspect query plans to evaluate access and execution. Supports measured index selection in W12; this plan makes no measured index-performance claim.

Provider/framework guidance was consulted during the preceding review. Recheck exact installed versions and enabled provider products before implementation. Architecture proposals, work order, and acceptance scenarios are recommendations, with unresolved choices recorded in SPEC.md.
