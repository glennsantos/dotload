---
id: SPEC-maintainability-and-scalability
companions:
  - implementation-plan.md
  - verification.md
  - evidence.md
  - ../../../docs/architecture.md
  - ../../../docs/operations.md
  - ../../../docs/configuration.md
sources: []
---

# dotload maintainability and scalability

Proposed implementation contract, created 2026-10-04 with `bmad-spec`. Derived from the canonical `.memlog.md` and its cited sources. Implementation has not started. Read every companion alongside this spec.

## Why

Sellers, buyers, and maintainers need trustworthy payments, protected downloads, reproducible releases, and code that can change without inconsistent business rules. The source review found authentication gaps, payment and payout consistency risks, conflicting configuration, local file storage, and suppressed build checks. Address correctness and security before increasing application capacity.

## Capabilities

- **CAP-1**
  - **intent:** The application accepts payment notifications only from the configured payment provider.
  - **success:** Missing or invalid callback tokens reject without side effects; valid documented tokens reach a common processing service.
- **CAP-2**
  - **intent:** Buyers receive each paid purchase once, with correct seller and buyer accounting despite repeated or delayed notifications.
  - **success:** Duplicate and concurrent events produce one financial effect; stale events cannot regress completion; seller, buyer, and guest attribution passes the defined accounting checks.
- **CAP-3**
  - **intent:** Sellers withdraw only spendable funds without duplicate transfers.
  - **success:** Competing requests cannot reserve more than the balance including fees; retries retain the operation identity; uncertain provider outcomes reconcile without duplicate transfers.
- **CAP-4**
  - **intent:** Users access only data and downloads permitted by their verified identity or purchase entitlement.
  - **success:** Protected operations enforce ownership near data access, expose minimal outputs, pass cross-user denial checks, and exclude credentials from logs.
- **CAP-5**
  - **intent:** Buyers and sellers see and record consistent monetary amounts and fees.
  - **success:** Exact amounts use explicit currencies and rounding; display and settlement agree; valid zero fees work; retained fee administration is authorized and persistent.
- **CAP-6**
  - **intent:** Developers and operators run the application with valid, consistent configuration.
  - **success:** Missing required secrets produce actionable startup failures, production email links use HTTPS, examples match consumers, and seeded login accounts use the normal password-hashing contract.
- **CAP-7**
  - **intent:** Maintainers reproduce the database schema and identify the owner of each database operation.
  - **success:** One authoritative migration workflow rebuilds the schema; runtime and seeding responsibilities are documented; misleading fallback paths are removed or intentionally supported.
- **CAP-8**
  - **intent:** Maintainers change business areas through explicit, validated interfaces.
  - **success:** Authentication, products, purchases, payments, payouts, and files have clear module ownership; route handlers delegate rules; migrated boundaries use typed inputs and outputs.
- **CAP-9**
  - **intent:** Release checks detect code failures and demonstrate the actual purchase journey.
  - **success:** CI blocks failed type checks, lint, tests, and builds; database tests exercise the active persistence path; a browser journey verifies registration through authorized download.
- **CAP-10**
  - **intent:** Operators reproduce dependencies and run the intended deployment artifact.
  - **success:** A pinned package manager and authoritative lockfile reproduce installs; the chosen artifact starts with aligned ports and required configuration; migration and recovery procedures are rehearsed.
- **CAP-11**
  - **intent:** Entitled buyers retrieve files regardless of the application instance serving their request.
  - **success:** Private shared storage delivers migrated files with verified integrity; unauthorized access fails; upload bounds, URL expiration, and download-limit semantics pass explicit checks.
- **CAP-12**
  - **intent:** Users receive complete, correct lists and balances as stored data grows.
  - **success:** Aggregates cover the full database dataset per currency; lists paginate with bounded responses; product slugs are database-unique; query plans and representative load meet the agreed targets.
- **CAP-13**
  - **intent:** Operators recover accepted payment, payout, and notification work after failures.
  - **success:** Accepted events survive a process restart, retries do not repeat financial effects, exhausted jobs are visible, and monitoring detects processing and reconciliation failures.

## Constraints

- Preserve existing published product links, seller ownership, and entitled authenticated and guest purchase access through staged migration.
- Authenticate and durably record an event before acknowledging it for asynchronous processing. Do not return success for work that exists only in process memory.
- Enforce money-operation uniqueness and atomic local updates in the database. Provider calls and local transactions require explicit recovery; they are not a shared atomic transaction.
- Keep currencies separate and define rounding before money migration. Preserve historical records until reconciliation establishes the intended correction.
- Do not treat RLS as protection for service-role queries that bypass it, or assume custom JWT sessions are Supabase Auth sessions.
- Migrate callers before deleting helpers or retiring routes. Inventory actual production provider registrations before choosing the surviving webhook URL.
- Add focused regression checks with each urgent fix. Broad restructuring must not delay an independently shippable security correction.
- Use provider documentation for the exact endpoint and installed framework version. Current guidance does not automatically justify switching the existing payout API version.
- Define workload and performance targets before claiming scale readiness; no capacity number is established by this review.

## Non-goals

- Microservices, a framework rewrite, a visual redesign, or new marketplace features.
- Production deployment, data migration, provider replacement, or money movement during this documentation task.
- A compliance certification, production security certification, fixed delivery estimate, or guaranteed traffic capacity.

## Success signal

- A release from a clean checkout passes enforced checks and the test-environment seller-to-buyer journey. Invalid access is denied, duplicate events leave one financial effect, concurrent payouts cannot overspend, and files work across two application instances.
- The selected deployment and workers recover from injected failures, monetary backfills reconcile, and representative query and load results meet explicitly agreed targets. Evidence is recorded as described in `verification.md`.

## Assumptions

- Keep one Next.js application with internal modules and existing providers unless an architecture decision demonstrates a concrete need to change them.
- Priorities are technical recommendations from the review, not a funded schedule or authorization for production changes.

## Open questions

- Which hosting target, production branch, Xendit products, API versions, and registered webhook endpoints are active?
- Which currencies, rounding rules, historical accounting corrections, guest accounting treatment, fee rules, and administrator roles are approved?
- Which private storage provider, upload limits, and download-counting semantics apply?
- What workload, response-time target, worker-lag target, alert ownership, and recovery objective define scale readiness?
- Which migration workflow, privileged access model, and durable worker deployment should be selected?

Resolve each question before its dependent implementation or cutover; independent corrective work can proceed.
