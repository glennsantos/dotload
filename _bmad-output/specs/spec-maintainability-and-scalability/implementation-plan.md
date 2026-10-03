# Implementation plan

Proposed work packages derived from `.memlog.md`, not completed stories or a sprint commitment. Capability IDs refer to [SPEC.md](SPEC.md); acceptance IDs refer to [verification.md](verification.md). Source evidence is in [evidence.md](evidence.md).

## Order and release gates

| Phase | Work | Exit gate |
| --- | --- | --- |
| Preparation | Inventory callers, provider registrations, schema and current check failures; establish isolated fixtures | Reproducible baseline and evidence; unresolved choices assigned to the dependent work |
| 1: correctness and authorization | W1–W5, P0 | Callback authentication, accounting, payout reservation, access denial, and exact-money regression checks pass for changed paths |
| 2: release reliability | W9–W10, P1 | Enforced checks and a clean install/build/start on the selected deployment model |
| 3: maintainable boundaries | W6–W8, P1 | Validated configuration, authoritative migrations, typed module contracts, and migrated callers |
| 4: storage and workload growth | W11–W13, P2 | Two-instance delivery, complete aggregates, durable failure recovery, and measured workload targets |

P0 means financial or access correctness takes precedence. P1 means release and maintenance reliability. P2 means the remaining storage and workload work. These are priorities within this plan, not scores from a production incident assessment.

Ship small verified corrections. Start the necessary database transaction boundary and durable event identity during phase 1; complete general module extraction in phase 3. Add durable receipt before enabling asynchronous acknowledgement, even if the broader worker platform ships in phase 4. Do not defer exact money, payout reservation, or per-currency balance correctness as mere performance work.

## Work packages

### W1: require documented callback authentication

- Maps to CAP-1; P0; verify V1.
- Reject missing or incorrect `x-callback-token` and missing server configuration without changing purchase state. Use the documented verification-token contract rather than a body HMAC for this header.
- Validate the supported event payloads. Route all supported webhook URLs into a common payment service during transition.
- Retire duplicate public URLs only after the active Xendit registrations and callers are known. Dependency: provider endpoint inventory; no database refactor is required to close the immediate missing-token gap.

### W2: make purchase completion repeatable and accounting explicit

- Maps to CAP-2; P0; verify V2.
- Define provider event identity and uniqueness for each supported event type. Validate provider payment identity, amount, currency, and purchase association before granting access.
- Use database transactions or a transactional database function for guarded purchase transition and ledger writes. The local operation must either fully commit or leave no partial accounting state.
- Replace the positional attribution wrapper with explicit seller income and buyer debit operations. Define guest treatment without inserting a fictional user that violates foreign keys.
- Prevent delayed pending or failed events from overwriting completed state. Define refunds and reversals separately rather than treating every status as freely interchangeable.
- Dependencies: W1, agreed accounting and status rules, minimal transactional data boundary, exact money from W5, and durable event identity from W13 as needed for the chosen processing model.

### W3: reserve funds and recover payout attempts

- Maps to CAP-3; P0; verify V3.
- Validate amount and destination server-side. Reject non-positive or invalid amounts and amounts that cannot cover required fees.
- Compute spendable funds per currency with approved debit/credit rules and subtract reserved payouts. Reserve the gross withdrawal including fees atomically before contacting Xendit.
- Persist the payout operation, immutable request payload, and stable provider idempotency key. Reuse the key on retries of that operation; do not generate it from the retry time.
- Track requested, reserved, submitted, uncertain, completed, and failed outcomes as appropriate to the provider contract. Release reservations only after a confirmed failure; a timeout after provider acceptance requires lookup/reconciliation.
- Reconcile provider notifications and local entries without duplicate payout or fee postings. Resolve the schema `Payout` versus transaction-derived payout ownership.
- Dependencies: W4, W5, W2's accounting contract, minimal transactional persistence, provider API-version decision and test credentials.

### W4: enforce authorization at the data boundary

- Maps to CAP-4; P0; verify V4.
- Centralize session verification and require verified identity for protected service operations. Audit every API route, public product projection, and download route; middleware coverage is not the authorization contract.
- Keep privileged clients and secrets in server-only modules. Scope ownership queries and return only permitted fields; verify product visibility on public reads.
- Choose whether ordinary queries run under scoped application authorization, database RLS with compatible identity, or both. Service-role access remains a privileged exception with explicit checks.
- Remove cookie/token logging and redact purchase access codes, provider credentials, and bank details from diagnostic output.
- Dependencies: route inventory. Managed-auth migration is not required to consolidate existing checks.

### W5: make money and fees exact

- Maps to CAP-5; P0; verify V5.
- Choose decimal database values or integer minor units and define application arithmetic, wire serialization, currency precision, and rounding. Do not convert exact database values back into inexact arithmetic indiscriminately.
- Use one authoritative fee function for quotes and settlement, with explicit validation and valid zero-value handling. Retain fee configuration updates only if they require the defined admin role and persist; otherwise remove the misleading operation.
- Audit existing values and entries before backfill. Report attribution errors, duplicate entries, currency mixing, and discrepancies for correction rather than silently rewriting history.
- Dependencies: approved currency, fee, guest-accounting and historical-correction policy. Use the staged migration procedure below.

### W6: validate configuration and repair setup

- Maps to CAP-6; P1; verify V6.
- Centralize server environment validation, distinguish required values from disabled optional integrations, and remove literal JWT/download/provider-key fallbacks.
- Define a validated application origin with a scheme; emit HTTPS production verification, reset and purchase links, with intentional HTTP localhost support.
- Repair duplicate or obsolete environment examples and align database connection variables with the selected migration/runtime paths.
- Hash seed passwords with the normal application contract and use only disposable development data. Update setup and configuration documentation alongside consumer changes.
- Dependencies: W7 for final connection variables and the target deployment inventory.

### W7: declare database and migration ownership

- Maps to CAP-7; P1; verify V7.
- Select one migration authority across Prisma, Supabase migrations, and the standalone SQL file. Document how production drift is detected and how a fresh database is created.
- The initial proposal keeps Supabase as the runtime query interface and Prisma for schema/migrations/seeding. Record any replacement as a separate architecture decision.
- Implement financial transactions through an explicit repository operation or database function. Do not assume several Supabase HTTP writes are one transaction.
- Remove misleading fallback helpers after checking callers, or implement an intentional, tested fallback contract if that becomes a requirement. Do not delete unrelated models without tracing ownership.
- Dependencies: database ownership decision; existing production schema inspection before a migration cutover.

### W8: extract typed business modules

- Maps to CAP-8; P1; verify V8.
- Give authentication, products, purchases, payments, payouts, and files separate service/repository responsibilities inside the existing application.
- Keep route handlers to authentication context, input parsing/validation, service invocation, and HTTP mapping. Centralize business rules and consistent error responses without exposing internal errors to clients.
- Use shared request schemas and generated database types; return minimal typed result objects. Replace unrestricted `any` at migrated boundaries rather than attempting a repository-wide rewrite in one change.
- Migrate and verify callers before removing legacy helpers or duplicate routes. Update the API inventory and ownership documentation.
- Dependencies: corrected behavior from W1–W5 and W7's ownership contract.

### W9: enforce checks and test actual behavior

- Maps to CAP-9; P1; verify V9.
- Repair current check failures and enforce type checking, lint, tests, and production builds in CI. Remove build suppressions after the corresponding checks pass; verify the lint command against the installed Next.js version.
- Split unit, database integration, and real browser suites with appropriate environments. Update stale Prisma mocks for the active Supabase path; use isolated database fixtures for constraints, transactions, and access policies.
- Replace the missing Jest e2e target with an actual browser journey. Include guest access, payment notifications, seller balances, and denied downloads.
- Tests for W1–W5 ship with those corrections and do not wait for this general suite repair. Keep production-provider tests out of ordinary PR checks.
- Dependencies: deterministic test configuration and disposable database/provider environments.

### W10: reproduce installs and deployment

- Maps to CAP-10; P1; verify V10.
- Pin the selected pnpm version, keep one authoritative dependency lockfile, and require frozen installs. Remove conflicting lockfiles after verifying the chosen workflow.
- Identify the supported deployment model. If retaining the current Docker approach, enable Next.js standalone output, copy required assets, align the listener and Compose mapping, and supply the actual required Supabase/email configuration.
- Document migration execution separately from builds, startup/readiness checks, secrets, file-storage assumptions, and recovery. Rehearse the selected deployment model in an isolated environment.
- Dependencies: target hosting decision, W6 configuration contract, W7 migration authority, and W9 release checks. Current-host recovery may require these prerequisites earlier.

### W11: migrate downloads to private shared storage

- Maps to CAP-11; P2; verify V11.
- Select private Supabase Storage or another object store and persist stable object keys. Keep authorization in the application before generating bounded-lifetime download URLs.
- Specify whether limits count issued links or completed transfers. A signed URL can be reused until expiration; strict per-transfer counting needs a delivery design that enforces that rule.
- Define upload size/count bounds and delivery behavior before replacing in-memory buffering. Verify MIME/extension validation and reject uploads exceeding the selected bounds.
- Inventory and migrate existing local files, verify integrity, switch lookup by stored object key, and remove recursive filename-search fallbacks after callers and data migrate.
- Dependencies: W4, storage provider and counting decisions, existing-object inventory and deployment access.

### W12: aggregate and paginate against complete data

- Maps to CAP-12; P2; verify V12.
- Compute monetary summaries in SQL over complete data, separated by currency. W3 must already have a correct complete-data balance source; this work extends that approach to reporting and general lists.
- Use bounded pagination with deterministic ordering and minimal column projections. Prefer cursor pagination for growing histories when the query pattern warrants it.
- Inspect query plans before selecting indexes. Candidates include ownership plus creation order, purchase status, and file/purchase relationships; verify against actual query shapes.
- Audit duplicate product slugs, resolve conflicts while preserving published links, then enforce database uniqueness.
- Dependencies: W5 and W7; representative fixtures and agreed workload/latency targets before declaring performance success.

### W13: persist background work and expose recovery

- Maps to CAP-13; P2, with financial durability prerequisites in P0; verify V13.
- Persist verified events before returning 2xx for asynchronous handling. A database inbox/outbox with a worker is an option; choose the deployment mechanism before committing to a queue product.
- Make completion, notification, and reconciliation jobs repeatable. Commit required outbox records with the related local financial state. Configure bounded retries, backoff, failure visibility, and a safe replay procedure.
- Reconcile accepted-but-unrecorded provider outcomes and unresolved payouts. Email failures must remain recoverable without repeating purchase accounting.
- Use structured redacted logs with request/event/payout identifiers. Monitor processing failures and lag, unresolved payouts, reconciliation discrepancies, database query latency, and failed storage operations; assign alert owners and targets.
- Dependencies: W2–W5, worker-hosting decision, and monitoring/recovery targets. Durable operation records are required before introducing asynchronous financial acknowledgement.

## Migration and recovery

1. Inventory callers, registered provider URLs, historical amounts, ledger entries, duplicate slugs, schema drift, and local file objects. Record evidence without secrets.
2. Add compatible fields, operation records, and indexes; stage constraints only after validating existing data. Rehearse backups and restoration for the selected database and storage.
3. Backfill in resumable batches. Reconcile amounts, currencies, accounting attribution, links, and object integrity before switching readers or writers.
4. Migrate callers and switch behavior in independently verifiable releases. Observe provider reconciliation and error rates before retiring old paths.
5. Remove legacy fields/routes/objects only after verified migration and the chosen recovery window. Update the project docs and regenerate the API inventory when methods or routes change.

Recovery must preserve operation identity and recorded provider outcomes. Do not roll back to an unauthenticated webhook, replay financial side effects, delete payout reservations with uncertain outcomes, or remove old objects before delivery has been verified. External transfers require reconciliation or an explicit compensating procedure; application rollback does not undo them.

## Decisions before dependent work

| Decision | Blocks |
| --- | --- |
| Hosting target and registered provider/API contracts | W1 endpoint retirement, W3 provider integration, W10 deployment, W13 worker selection |
| Currency, rounding, debit/credit, guest, fee and admin rules | W2/W3 accounting cutover and W5 backfill |
| Migration authority and privileged access model | W7 cutover and W8 final repository contracts |
| Storage provider, upload limits and download semantics | W11 delivery cutover |
| Load profile, latency/lag targets, alert owner and recovery objective | W12/W13 scale-readiness declaration |

No calendar estimates or traffic promises are assigned without those inputs. Work packages can feed `bmad-architecture` and then `bmad-create-epics-and-stories`; they are not a generated `stories.yaml` dispatch queue.
