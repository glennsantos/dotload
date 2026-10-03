# Acceptance and verification

All checks below are proposed and **not run**. They map one-to-one to the capability IDs in [SPEC.md](SPEC.md). Use disposable accounts, a development database, private test storage, and provider test mode. Keep secrets and purchase access codes out of committed evidence.

| ID | Capability | Required checks |
| --- | --- | --- |
| V1 | CAP-1 | Missing/incorrect callback token and missing configured secret cause no purchase/ledger writes. A valid documented token succeeds. Unsupported or malformed payloads cannot grant access. Transitional webhook URLs enforce the same policy. |
| V2 | CAP-2 | Deliver the same event repeatedly and concurrently; assert one purchase transition and the intended ledger entries. Inject failure between local writes and assert atomicity. Send stale pending/failed events after completion and assert no regression. Reject payment ID, amount or currency mismatch. Verify seller, authenticated buyer, self-purchase if supported, and guest attribution. |
| V3 | CAP-3 | Submit competing withdrawals whose combined gross amount exceeds funds; only valid reservations proceed. Pending payouts and fees reduce spendable funds. Reject zero/negative/invalid amounts. Simulate provider acceptance followed by network timeout or local persistence failure; retry/reconcile with the same operation key and assert one transfer. Confirm a failed payout releases its reservation exactly once. |
| V4 | CAP-4 | Seller A cannot read or mutate Seller B's private products, files, balances or payouts. Non-public products are not exposed by public endpoints. Unentitled, expired or unpaid purchase requests cannot download. Test authenticated and guest entitlements. Run real session verification tests separate from mocked units; assert logs contain no credentials or entitlement codes. |
| V5 | CAP-5 | Verify exact arithmetic, currency precision, boundary rounding, valid zero fees, quote-versus-settlement equality and currency separation. Reconcile every migrated money record and aggregate against the approved policy; report discrepancies. If retaining fee updates, verify unauthorized denial and persistence across restart. If removing them, verify callers no longer report fake success. |
| V6 | CAP-6 | Start with missing/invalid required values and assert clear configuration failures without secret values. Optional disabled integrations remain explicitly disabled. Verify HTTPS production email links and valid local HTTP links. Follow the repaired example from a clean checkout. Seed a disposable account and log in through the normal hashing path. |
| V7 | CAP-7 | Rebuild a fresh database with the chosen migration authority and verify tables, constraints and generated types. Upgrade a representative existing database. Verify drift detection and transactional financial repository behavior. Trace remaining fallback callers and demonstrate removal or supported behavior. |
| V8 | CAP-8 | Typecheck migrated module inputs/outputs; reject invalid request payloads. Verify route-level behavior remains compatible after caller migration. Inspect module ownership and absence of duplicate migrated business rules. Confirm only permitted output fields and generic client-safe errors cross the boundary. |
| V9 | CAP-9 | Introduce a controlled type error, lint violation, failing test and build failure separately; each blocks CI. Database tests exercise the actual runtime persistence path. Run a real browser journey through registration/verification, login, product creation/upload, guest or buyer checkout, test payment completion, download and seller accounting. Include denied-download assertions. |
| V10 | CAP-10 | Install from the authoritative lockfile without modifications; record Node/pnpm versions. Build/start the intended artifact with complete environment configuration. For Docker, verify standalone files/assets and the mapped listener. Rehearse separate migration and recovery procedures against disposable infrastructure. |
| V11 | CAP-11 | Upload through instance A and authorize/download through instance B without shared local disk. Verify migrated object integrity and published purchase access. Direct unauthenticated object requests fail. Verify expired URLs, entitlement denial, file bounds, and the agreed link-issued or transfer-counted limit semantics. |
| V12 | CAP-12 | Load more rows than the configured API response limit and assert SQL totals match the complete fixture. Paginate tied timestamps without missing or repeating rows. Keep currencies separate. Attempt concurrent duplicate slug creation and assert database enforcement. Record plans and timings for representative datasets and compare with agreed workload targets. |
| V13 | CAP-13 | Crash after durable receipt/2xx and before processing; restart and complete work. Crash after financial commit before notification; retry without duplicate accounting. Exhaust retries and verify visible failure plus safe replay. Reconcile provider/local disagreement and uncertain payouts. Verify redacted identifiers, alert delivery, processing lag, and the agreed recovery objective. |

## Release evidence

For each shipped work package, record:

- Capability and acceptance IDs, commit, date, selected environment and artifact version.
- Fixture size, concurrency scenario, provider API/version and expected versus actual result.
- Commands or test names, exit codes, and redacted report links. Record failures and unresolved concerns explicitly.
- Migration reconciliation, recovery rehearsal, query plans and workload measurements where applicable.

Store execution records under `_bmad-output/test-artifacts/maintainability-and-scalability/` when implementation begins. Do not mark a capability complete from a checklist alone. A mocked suite does not prove provider authentication, database isolation, object-storage delivery, or browser behavior.

## Baseline commands

The current documented commands are `pnpm test:backend`, `pnpm test:frontend`, `pnpm test:integration`, `pnpm exec tsc --noEmit`, and `pnpm build`. Use `pnpm test:ci` for the configured coverage run. They are an inventory, not verified passing results. The existing `pnpm lint` command must be checked for the installed framework version, and `test:e2e` must be replaced or repaired before counting it as browser coverage. See [current operations](../../../docs/operations.md).

Coverage thresholds are existing configuration, not evidence of correctness. Add meaningful financial, authorization, recovery and cross-instance tests; do not substitute a coverage percentage for these checks.

## Completion gates

- Changed payment/access paths pass V1–V5 before handling real funds or granting paid content under the new behavior.
- The selected release workflow passes V9–V10 and records deployment prerequisites before deployment.
- V11 must pass before relying on multiple application instances for file delivery.
- V12–V13 require agreed targets and recorded measurements before claiming scale readiness.
- Backfills and storage migrations require reconciled data plus rehearsed recovery before destructive cleanup.
