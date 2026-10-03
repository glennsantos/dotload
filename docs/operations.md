# Deployment and verification

The repository does not establish the active hosting project, production branch, domain, or environment settings. This guide describes checks for a proposed deployment.

## Run checks

```sh
pnpm test:backend
pnpm test:frontend
pnpm test:integration
pnpm exec tsc --noEmit
pnpm build
```

Run a focused test with:

```sh
pnpm test -- tests/lib/file-utils.test.ts --runInBand
```

Use `pnpm test:ci` for the coverage run. [Jest configuration](../jest.config.js) loads `tests/setup.js`, not `tests/setup.ts`. It defaults to jsdom. The backend script selects Node, but the integration script does not override the environment.

The setup and mappings mock dependencies such as `jose` and Cloudinary. Passing tests does not establish that live authentication, storage, Supabase, or payments work. `test:e2e` targets `tests/e2e`, which is absent from the inspected tree. [The journey runner](../tests/run-frontend-journey.js) invokes Jest, not browser automation.

[next.config.js](../next.config.js) skips TypeScript and ESLint errors during build. Run type checking separately. `pnpm lint` invokes `next lint`; check its behavior against the installed Next.js version before relying on it as a quality gate. This documentation change includes no application test results or coverage claims.

## Prepare a deployment

1. Configure the target environment using the [variable reference](configuration.md).
2. Apply existing migrations to the target database:

   ```sh
   pnpm exec prisma migrate deploy
   ```

3. Build the application:

   ```sh
   pnpm build
   ```

4. On a persistent Node host, start the production server:

   ```sh
   pnpm start
   ```

The start script uses port 2222. The build generates Prisma but does not apply migrations. [Amplify configuration](../amplify.yml) also leaves migrations separate from the build.

## Resolve observed gaps

These observations come from source inspection, not a live deployment test.

| Gap | Evidence and consequence |
| --- | --- |
| Local file storage | [Upload handler](../app/api/products/[id]/files/route.ts) writes locally. Upload and download handlers need shared, writable, persistent storage. Cloudinary covers do not supply it. |
| Docker output mismatch | [Dockerfile](../Dockerfile) copies `.next/standalone` and runs `server.js`; [Next config](../next.config.js) does not set `output: 'standalone'`. Resolve this before using the image. |
| Docker port mismatch | Docker sets `PORT=3000`, while [Compose](../docker-compose.yml) maps `2222:2222`. Align the listener and mapping. |
| Webhook authentication | [Xendit webhook](../app/api/webhooks/xendit/route.ts) comments out callback verification. [Payment webhook](../app/api/payments/webhook/route.ts) verifies only when the header exists. A configured secret does not make verification mandatory. |
| HTTP email links | [Email module](../lib/email.ts) prepends `http://` to `DOMAIN`. Supplying a scheme creates malformed links. HTTPS links need a code change. |
| Fee disagreement | [Fee utilities](../lib/fee-utils.ts) and [fee-config](../app/api/fee-config/route.ts) have different fixed-fee defaults. Verify explicit configuration before relying on quoted fees. |
| Credential logging | [Auth helpers](../lib/auth-utils.ts) log cookies with debugging enabled. [Login](../app/api/auth/login/route.ts) enables debugging in all environments. Review logs before handling production credentials. |

## Check the deployed flow

Use a test account and provider test environment:

1. Register, receive verification mail, and log in.
2. Create a product with a cover and downloadable file.
3. Open its public page and create a purchase.
4. Complete a test payment and confirm the purchase status.
5. Download the file and verify an unauthorized request cannot retrieve it.
6. Check the seller transaction and payout views.

Record the URL, environment, test data, and results. Historical checklist marks are not deployment evidence.
