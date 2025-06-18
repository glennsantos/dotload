# dotload

A modern, flexible digital product marketplace platform built with Next.js and Prisma.

Made by (c) Glenn Santos

## Overview

dotload is an innovative platform for creators to sell digital products, offering flexible product variations, seamless file uploads, and easy payment configuration.

## Table of Contents

- [Local Development](#local-development)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Database Setup (Supabase)](#database-setup-supabase)
  - [Environment Configuration](#environment-configuration)
  - [Auto-Deployment Setup](#auto-deployment-setup)
- [Payment Gateway Integration](#payment-gateway-integration)
- [Email Service Configuration](#email-service-configuration)

## Local Development

### Prerequisites
- Node.js 22.x
- pnpm (Package Manager)
- PostgreSQL 14+

### Setup
1. Clone the repository
```bash
git clone https://github.com/glennsantos/dotload.git
cd dotload
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. Configure your database (Supabase or Local PostgreSQL)

   **Option A: Using Supabase (Recommended for Production)**
   ```bash
   # Add to your .env file:
   DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   **Option B: Using Local PostgreSQL**
   ```bash
   # Add to your .env file:
   LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/dotload
   DATABASE_URL=postgresql://postgres:password@localhost:5432/dotload
   DIRECT_URL=postgresql://postgres:password@localhost:5432/dotload
   ```

   The application automatically detects Supabase configuration and falls back to local PostgreSQL when not available.

5. Set up the database
```bash
pnpm prisma migrate dev
```

6. Test your database connection
```bash
# Visit http://localhost:2222/api/test-db after starting the server
# This will show your current database configuration
```

7. Set up HTTPS for local development
   ```bash
   # Install mkcert if not already installed
   curl -sSL https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o mkcert
   chmod +x mkcert
   
   # Create certificates
   mkdir -p .certs
   ./mkcert -install
   ./mkcert -cert-file .certs/local-cert.pem -key-file .certs/local-key.pem localhost 127.0.0.1 ::1
   ```

8. Run the development server with HTTPS
   ```bash
   pnpm dev  # Uses HTTPS
   # or for HTTP only:
   # pnpm dev:http
   ```
   
   Note: Your browser will show a security warning for the self-signed certificate. You'll need to accept the risk and proceed.

9. Open [http://localhost:2222](http://localhost:2222) in your browser to see the app.

### Seeding the Database

To populate the database with test data, you can use the seeder script. The seeder will create:
- 10 test users
- 10 products per user
- 10 purchases per product (with random statuses)

1. Install required dependencies:
```bash
pnpm add -D tsx ts-node @types/node node-fetch@2 --legacy-peer-deps
```

2. Generate the Prisma client (if not already done):
```bash
pnpm prisma generate
```

3. Run the seeder script:
```bash
pnpm seed
```

This will populate your database with test data. The script will log its progress as it creates users, products, and purchases.

### Additional Commands
- Build for production: `pnpm build`
- Start production server: `pnpm start`
- Lint the project: `pnpm lint`
- Run tests: `pnpm test`

## Testing

### Running Tests

The test suite is configured to work with Next.js 15+ and Node.js 22.x. Tests are organized by environment and feature area.

```bash
# Run all tests
npm test
# or
pnpm test

# Run tests in watch mode
npm run test:watch
# or
pnpm run test:watch

# Run tests with coverage report
npm run test:coverage
# or
pnpm run test:coverage

# Run specific test suites
npm run test:backend      # Backend API tests only (Node.js environment)
npm run test:frontend     # Frontend component tests only (jsdom environment)
npm run test:integration  # Integration tests only (Node.js environment)
npm run test:e2e         # End-to-end tests only

# Run tests for CI/CD (non-interactive)
npm run test:ci
# or
pnpm run test:ci

# Generate test report
npm run test:report
# or
pnpm run test:report
```

### Test Environment Configuration

The test suite uses different environments for different test types:
- **Frontend tests**: jsdom environment for React component testing
- **Backend tests**: Node.js environment for API route testing
- **Integration tests**: Node.js environment for full-stack testing

### Prerequisites for Testing

1. **Node.js 22.x**: Ensure you're using the correct Node.js version
2. **Dependencies**: All test dependencies are installed with `npm install` or `pnpm install`
3. **Environment**: Test environment variables are automatically configured in `tests/setup.ts`

### Test Compatibility

The test suite has been updated to handle:
- **ESM modules**: Proper handling of ES modules like `jose` library
- **Next.js 15+**: Compatible with latest Next.js features and APIs
- **TypeScript**: Full TypeScript support with proper type checking
- **Mock compatibility**: Updated mocks for Next.js Request/Response objects

## Production Deployment

### Vercel Deployment

Our application is deployed on Vercel with automatic deployments from the `amplify-deployment` branch.

#### Current Deployment Details
- **Platform**: Vercel
- **Production URL**: https://dotload-friends-projects-5a78b24f.vercel.app
- **Auto-Deploy Branch**: `amplify-deployment`
- **Node.js Version**: 22.x
- **Database**: Supabase (hjihiagddnhgrwrtbwsv)

#### Deployment Configuration

The project includes a `vercel.json` configuration:
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["sin1"]
}
```

### Database Setup (Supabase)

#### Production Database
- **Provider**: Supabase
- **Project ID**: hjihiagddnhgrwrtbwsv
- **Region**: Singapore (ap-southeast-1)
- **Connection**: Automatic connection pooling enabled

#### Database Schema
The database schema is managed through Prisma migrations:
```bash
# Apply migrations to production (handled automatically by Vercel)
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

### Environment Configuration

#### Required Environment Variables

**Database Configuration:**
```bash
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Application Configuration:**
```bash
NEXT_PUBLIC_BASE_URL=https://dotload-friends-projects-5a78b24f.vercel.app
DOMAIN=dotload-friends-projects-5a78b24f.vercel.app
NODE_ENV=production
```

**Payment Integration:**
```bash
XENDIT_API_KEY=your_xendit_api_key
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_WEBHOOK_SECRET=your_webhook_secret
```

**Email Configuration:**
```bash
EMAIL_FROM=no-reply@dotload.com
# Additional email service configuration as needed
```

#### Setting Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your dotload project
3. Navigate to Settings → Environment Variables
4. Add each environment variable for Production, Preview, and Development environments

### Auto-Deployment Setup

#### Current Configuration
- **Production Branch**: `amplify-deployment`
- **Auto-Deploy**: Enabled for `amplify-deployment` branch
- **Preview Deployments**: Enabled for all other branches

#### Configuring Auto-Deployment

1. **Vercel Dashboard Configuration**:
   - Go to [Project Settings](https://vercel.com/friends-projects-5a78b24f/dotload/settings/git)
   - Set Production Branch to `amplify-deployment`
   - Enable auto-deployment

2. **Deployment Workflow**:
   ```bash
   # Make changes on amplify-deployment branch
   git checkout amplify-deployment
   
   # Make your changes and commit
   git add .
   git commit -m "Your changes"
   
   # Push to trigger auto-deployment
   git push origin amplify-deployment
   ```

3. **Deployment Verification**:
   - Check deployment status in Vercel Dashboard
   - Monitor build logs for any issues
   - Verify functionality on production URL

#### Manual Deployment (if needed)
```bash
# Install Vercel CLI
npm install -g vercel

# Link project (one-time setup)
vercel link

# Deploy to production
vercel --prod
```

## Payment Gateway Integration

### Xendit Setup

1. **Create Account**: Sign up at [Xendit Dashboard](https://dashboard.xendit.co/register)

2. **API Configuration**:
   - Generate API keys from Settings → API Keys
   - Set up webhook endpoint: `https://dotload-friends-projects-5a78b24f.vercel.app/api/webhooks/xendit`
   - Configure webhook secret for security

3. **Environment Variables**:
   ```bash
   XENDIT_API_KEY=your_xendit_api_key
   XENDIT_SECRET_KEY=your_xendit_secret_key
   XENDIT_WEBHOOK_SECRET=your_webhook_secret
   ```

4. **Supported Payment Methods**:
   - Credit/Debit Cards
   - Bank Transfers
   - E-Wallets (GCash, PayMaya, etc.)
   - Direct Debit

## Email Service Configuration

### Current Implementation
The application uses a flexible email service configuration that can work with various providers.

#### Environment Variables
```bash
EMAIL_FROM=no-reply@dotload.com
# Additional email service configuration based on your provider
```

#### Supported Email Services
- AWS SES
- SendGrid
- Mailgun
- SMTP providers



### Deployment Checklist

- [x] Vercel project linked and configured
- [x] Production branch set to `amplify-deployment`
- [x] Auto-deployment enabled
- [x] Supabase database connected (hjihiagddnhgrwrtbwsv)
- [x] Environment variables configured in Vercel
- [x] Database schema migrated
- [x] Build and deployment pipeline working
- [x] Production URL accessible: https://dotload-friends-projects-5a78b24f.vercel.app
- [ ] Custom domain configured (optional)
- [ ] Xendit payment gateway configured
- [ ] Email service configured
- [ ] SSL certificate configured (handled by Vercel)
- [ ] Monitoring and analytics set up

### Troubleshooting

#### Common Deployment Issues

1. **Build Failures**:
   - Check Node.js version compatibility (22.x)
   - Verify all dependencies are installed
   - Review build logs in Vercel Dashboard

2. **Database Connection Issues**:
   - Verify Supabase environment variables
   - Check database URL format
   - Ensure database is accessible from Vercel

3. **Environment Variable Issues**:
   - Verify all required variables are set in Vercel
   - Check variable naming and values
   - Ensure variables are set for correct environments

4. **Auto-Deployment Not Working**:
   - Verify production branch is set to `amplify-deployment`
   - Check GitHub integration in Vercel
   - Ensure push is to the correct branch

### Support and Documentation

- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Documentation**: [https://www.prisma.io/docs](https://www.prisma.io/docs)

### Contributing

1. Fork the repository
2. Create a feature branch from `amplify-deployment`
3. Make your changes
4. Test locally
5. Submit a pull request to `amplify-deployment` branch

### License

This project is proprietary software. All rights reserved.