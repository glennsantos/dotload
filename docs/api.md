# API route inventory

Generated from `app/api/**/route.ts` by [generate-api-docs.py](tools/generate-api-docs.py).

Run `python3 docs/tools/generate-api-docs.py` from the repository root after changing routes. Only exported function declarations are listed. Implicit framework methods are not included.

Dynamic segments retain Next.js notation: `[id]` is one segment, and `[...path]` is a catch-all. Read the linked handler for body fields, responses, and authorization. This inventory does not guarantee that an endpoint is publicly accessible or production-ready.

[Middleware](../middleware.ts) matches only selected paths. Other handlers perform their own authentication checks. Diagnostic routes beginning with `/api/test-` also exist; review them before exposing a deployment.

| Route | Exported methods | Handler |
| --- | --- | --- |
| `/api/auth/change-password` | `POST` | [source](../app/api/auth/change-password/route.ts) |
| `/api/auth/check-session` | `GET` | [source](../app/api/auth/check-session/route.ts) |
| `/api/auth/create-from-purchase` | `POST` | [source](../app/api/auth/create-from-purchase/route.ts) |
| `/api/auth/forgot-password` | `POST` | [source](../app/api/auth/forgot-password/route.ts) |
| `/api/auth/login` | `GET`, `POST` | [source](../app/api/auth/login/route.ts) |
| `/api/auth/logout` | `GET`, `POST` | [source](../app/api/auth/logout/route.ts) |
| `/api/auth/me` | `GET` | [source](../app/api/auth/me/route.ts) |
| `/api/auth/register` | `POST` | [source](../app/api/auth/register/route.ts) |
| `/api/auth/reset-password` | `POST` | [source](../app/api/auth/reset-password/route.ts) |
| `/api/auth/user-status` | `GET` | [source](../app/api/auth/user-status/route.ts) |
| `/api/auth/verify-email` | `GET`, `POST` | [source](../app/api/auth/verify-email/route.ts) |
| `/api/customers` | `GET` | [source](../app/api/customers/route.ts) |
| `/api/discount-codes/[id]` | `DELETE` | [source](../app/api/discount-codes/[id]/route.ts) |
| `/api/discount-codes` | `GET`, `POST` | [source](../app/api/discount-codes/route.ts) |
| `/api/downloads/file/[id]` | `GET` | [source](../app/api/downloads/file/[id]/route.ts) |
| `/api/downloads/secure/generate` | `POST` | [source](../app/api/downloads/secure/generate/route.ts) |
| `/api/downloads/secure` | `POST`, `GET` | [source](../app/api/downloads/secure/route.ts) |
| `/api/fee-config` | `GET`, `POST` | [source](../app/api/fee-config/route.ts) |
| `/api/fees` | `GET` | [source](../app/api/fees/route.ts) |
| `/api/files` | `GET`, `POST`, `DELETE` | [source](../app/api/files/route.ts) |
| `/api/files/secure-download` | `POST`, `GET` | [source](../app/api/files/secure-download/route.ts) |
| `/api/payments/check-pending` | `POST` | [source](../app/api/payments/check-pending/route.ts) |
| `/api/payments/create` | `POST` | [source](../app/api/payments/create/route.ts) |
| `/api/payments/status` | `GET` | [source](../app/api/payments/status/route.ts) |
| `/api/payments/webhook` | `POST` | [source](../app/api/payments/webhook/route.ts) |
| `/api/payments/xendit/card` | `POST` | [source](../app/api/payments/xendit/card/route.ts) |
| `/api/payments/xendit/direct-debit` | `POST` | [source](../app/api/payments/xendit/direct-debit/route.ts) |
| `/api/payments/xendit` | `POST` | [source](../app/api/payments/xendit/route.ts) |
| `/api/payouts` | `GET`, `POST` | [source](../app/api/payouts/route.ts) |
| `/api/products/[id]/cover-image` | `POST` | [source](../app/api/products/[id]/cover-image/route.ts) |
| `/api/products/[id]/digital-item` | `POST` | [source](../app/api/products/[id]/digital-item/route.ts) |
| `/api/products/[id]/discount-codes` | `DELETE` | [source](../app/api/products/[id]/discount-codes/route.ts) |
| `/api/products/[id]/external-links` | `POST` | [source](../app/api/products/[id]/external-links/route.ts) |
| `/api/products/[id]/files/[fileId]` | `DELETE` | [source](../app/api/products/[id]/files/[fileId]/route.ts) |
| `/api/products/[id]/files` | `POST`, `DELETE` | [source](../app/api/products/[id]/files/route.ts) |
| `/api/products/[id]/publish` | `PUT` | [source](../app/api/products/[id]/publish/route.ts) |
| `/api/products/[id]` | `GET`, `PUT`, `DELETE` | [source](../app/api/products/[id]/route.ts) |
| `/api/products/[id]/status` | `PUT` | [source](../app/api/products/[id]/status/route.ts) |
| `/api/products/[id]/variations/[variationId]` | `GET`, `PUT`, `DELETE` | [source](../app/api/products/[id]/variations/[variationId]/route.ts) |
| `/api/products/[id]/variations` | `GET`, `POST` | [source](../app/api/products/[id]/variations/route.ts) |
| `/api/products` | `POST`, `GET` | [source](../app/api/products/route.ts) |
| `/api/public/products/[slug]` | `GET` | [source](../app/api/public/products/[slug]/route.ts) |
| `/api/purchases/access` | `GET` | [source](../app/api/purchases/access/route.ts) |
| `/api/purchases/download` | `GET` | [source](../app/api/purchases/download/route.ts) |
| `/api/purchases/download-file/[id]` | `GET` | [source](../app/api/purchases/download-file/[id]/route.ts) |
| `/api/purchases` | `GET`, `POST` | [source](../app/api/purchases/route.ts) |
| `/api/purchases/temp-access` | `POST` | [source](../app/api/purchases/temp-access/route.ts) |
| `/api/purchases/user` | `GET` | [source](../app/api/purchases/user/route.ts) |
| `/api/secure-files/[...path]` | `GET` | [source](../app/api/secure-files/[...path]/route.ts) |
| `/api/test-db` | `GET` | [source](../app/api/test-db/route.ts) |
| `/api/test-supabase` | `GET` | [source](../app/api/test-supabase/route.ts) |
| `/api/test-supabase-user` | `GET` | [source](../app/api/test-supabase-user/route.ts) |
| `/api/test-user-permissions` | `GET` | [source](../app/api/test-user-permissions/route.ts) |
| `/api/transactions/payout` | `POST` | [source](../app/api/transactions/payout/route.ts) |
| `/api/transactions` | `GET` | [source](../app/api/transactions/route.ts) |
| `/api/upload` | `POST` | [source](../app/api/upload/route.ts) |
| `/api/user/password` | `PUT` | [source](../app/api/user/password/route.ts) |
| `/api/user/profile` | `GET`, `PUT` | [source](../app/api/user/profile/route.ts) |
| `/api/user/settings` | `GET`, `POST` | [source](../app/api/user/settings/route.ts) |
| `/api/webhooks/xendit` | `POST` | [source](../app/api/webhooks/xendit/route.ts) |
