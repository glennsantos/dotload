# dotload

A digital product marketplace built with Next.js, React, TypeScript, Supabase, and Prisma. Sellers manage products, checkout, downloadable files, and payouts.

Made by Glenn Santos.

## Documentation

Start with the [documentation index](docs/index.md), the project knowledge entry point for the installed BMAD workflows.

- [Run locally](docs/development.md)
- [Configuration reference](docs/configuration.md)
- [Application architecture](docs/architecture.md)
- [API route inventory](docs/api.md)
- [Deployment and verification](docs/operations.md)
- [BMAD documentation workflow](docs/bmad.md)

These guides describe the checked-in implementation. Older root documents provide background but can differ from current code. The root [PRD](PRD.md) contains frontend redesign tasks rather than complete product requirements. Live hosting settings have not been verified.

## Local development

Use Node.js 22, matching the [Dockerfile](Dockerfile), and pnpm. Configure a development Supabase project before exercising authentication and product routes. Those routes do not automatically fall back to local PostgreSQL.

```sh
pnpm install
```

Create `.env` using the [development guide](docs/development.md). Apply migrations to your development database, then start the server:

```sh
pnpm exec prisma migrate dev
pnpm dev
```

Open [http://localhost:2222](http://localhost:2222). The `dev` script runs HTTP. There is no `dev:http` script.

## Verification

```sh
pnpm test:backend
pnpm test:frontend
pnpm test:integration
pnpm exec tsc --noEmit
pnpm build
```

The build skips TypeScript and ESLint errors through [next.config.js](next.config.js). A successful build alone does not establish that those checks pass. See [deployment and verification](docs/operations.md) for test limitations and deployment gaps.

## Contributing

1. Fork the repository
2. Create a feature branch from `amplify-deployment`
3. Make your changes
4. Test locally
5. Submit a pull request to `amplify-deployment` branch

## License

This project is proprietary software. All rights reserved.
