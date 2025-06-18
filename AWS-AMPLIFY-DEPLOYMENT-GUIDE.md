# AWS Amplify Deployment Guide for Dotload

This guide provides step-by-step instructions for deploying the Dotload digital marketplace application on AWS Amplify.

## Overview

Dotload is a Next.js 15+ application with the following key features:
- Digital product marketplace
- PostgreSQL database with Prisma ORM
- File uploads with Cloudinary integration
- Payment processing with Xendit
- Email notifications with Resend
- User authentication with JWT

## Prerequisites

Before starting the deployment, ensure you have:

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with your Dotload code
3. **Domain Name** (optional, but recommended)
4. **Third-party Service Accounts**:
   - Cloudinary account for image/file storage
   - Xendit account for payment processing
   - Resend account for email services

## Step 1: Database Setup

### Option A: AWS RDS PostgreSQL (Recommended)

1. **Create RDS PostgreSQL Instance**:
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier alacarte-prod-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --engine-version 14.9 \
     --master-username postgres \
     --master-user-password YOUR_SECURE_PASSWORD \
     --allocated-storage 20 \
     --storage-type gp2 \
     --vpc-security-group-ids sg-xxxxxxxxx \
     --db-subnet-group-name default \
     --backup-retention-period 7 \
     --storage-encrypted \
     --publicly-accessible
   ```

2. **Configure Security Group**:
   - Allow inbound connections on port 5432 from Amplify's IP ranges
   - For initial setup, you can allow from anywhere (0.0.0.0/0) and restrict later

3. **Create Database**:
   ```sql
   CREATE DATABASE alacarte_prod;
   ```

### Option B: Supabase PostgreSQL (Alternative)

1. Create a new project on [Supabase](https://supabase.com)
2. Note down the connection string from Settings > Database
3. Use the connection string in your environment variables

## Step 2: Prepare Your Repository

### Update Next.js Configuration

Ensure your `next.config.js` is optimized for Amplify:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      // ... other domains
    ],
  },
  // Remove any server-specific configurations
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
```

### Create amplify.yml Build Specification

Create `amplify.yml` in your project root:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - '# Execute Amplify CLI with the helper script'
        - amplifyPush --simple
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
        - npx prisma generate
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Environment Variables Setup

You'll need to configure these environment variables in Amplify:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/alacarte_prod
DIRECT_URL=postgresql://username:password@your-rds-endpoint:5432/alacarte_prod

# Application Configuration
NEXTAUTH_URL=https://your-amplify-domain.amplifyapp.com
NEXTAUTH_SECRET=your-nextauth-secret-key
JWT_SECRET=your-jwt-secret-key
DOMAIN=your-amplify-domain.amplifyapp.com

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Payment Processing (Xendit)
XENDIT_API_KEY=your-xendit-api-key
XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_WEBHOOK_SECRET=your-xendit-webhook-secret
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=your-xendit-public-key

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# Fee Configuration
PAYOUT_PERCENTAGE_FEE=0.05
PAYOUT_FIXED_FEE=15

# File Upload Configuration
UPLOADS_DIR=/tmp/uploads
DOWNLOAD_SECRET=your-download-secret-key

# Node Environment
NODE_ENV=production
```

## Step 3: Deploy to AWS Amplify

### Using AWS Console

1. **Sign in to AWS Amplify Console**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" > "Host web app"

2. **Connect Repository**:
   - Select "GitHub" as your repository service
   - Authorize AWS Amplify to access your GitHub account
   - Select your Dotload repository
   - Choose the main/master branch

3. **Configure Build Settings**:
   - Amplify will auto-detect your build settings
   - Review and modify the `amplify.yml` if needed
   - Ensure the build command is set to `pnpm run build`

4. **Environment Variables**:
   - Go to "Environment variables" in the left sidebar
   - Add all the environment variables listed above
   - Make sure to use your actual values

5. **Deploy**:
   - Click "Save and deploy"
   - Wait for the build to complete (usually 5-10 minutes)

### Using AWS CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting

# Publish your app
amplify publish
```

## Step 4: Database Migration

After your app is deployed, you need to run database migrations:

1. **Option A: Using Amplify Console**:
   - Go to your app in Amplify Console
   - Navigate to "Build settings"
   - Add a post-build command in `amplify.yml`:
   ```yaml
   frontend:
     phases:
       preBuild:
         commands:
           - npm install -g pnpm
           - pnpm install
           - npx prisma generate
       build:
         commands:
           - pnpm run build
       postBuild:
         commands:
           - npx prisma migrate deploy
   ```

2. **Option B: Manual Migration**:
   - Use a temporary EC2 instance or local environment
   - Set the DATABASE_URL environment variable
   - Run: `npx prisma migrate deploy`

## Step 5: Custom Domain Setup (Optional)

1. **Purchase/Configure Domain**:
   - Use Route 53 or your existing domain provider
   - Create a CNAME record pointing to your Amplify domain

2. **Add Custom Domain in Amplify**:
   - Go to "Domain management" in Amplify Console
   - Click "Add domain"
   - Enter your domain name
   - Follow the verification process

3. **SSL Certificate**:
   - Amplify automatically provisions SSL certificates
   - Wait for DNS propagation (can take up to 48 hours)

## Step 6: Configure Webhooks

### Xendit Webhooks

1. **In Xendit Dashboard**:
   - Go to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/xendit`
   - Select relevant events (payment success, failure, etc.)

2. **Test Webhook**:
   - Use Xendit's webhook testing tool
   - Verify payments are processed correctly

## Step 7: File Upload Configuration

Since Amplify doesn't support persistent file storage, configure Cloudinary:

1. **Cloudinary Setup**:
   - Ensure all file uploads go through Cloudinary
   - Configure upload presets in Cloudinary dashboard
   - Set appropriate folder structure

2. **Update Upload Logic**:
   - Verify all file uploads use Cloudinary API
   - Remove any local file system dependencies

## Step 8: Monitoring and Logging

### CloudWatch Integration

Amplify automatically integrates with CloudWatch:

1. **Access Logs**:
   - Go to Amplify Console > Monitoring
   - View access logs, performance metrics

2. **Custom Metrics**:
   - Add custom logging in your application
   - Use `console.log()` for important events

### Error Tracking

Consider integrating error tracking:

```bash
# Install Sentry (optional)
pnpm add @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

## Step 9: Performance Optimization

### Caching Strategy

1. **Static Assets**:
   - Amplify automatically caches static assets
   - Configure cache headers in `next.config.js`

2. **API Routes**:
   - Implement appropriate caching for API responses
   - Use Redis or DynamoDB for session storage if needed

### Database Optimization

1. **Connection Pooling**:
   ```javascript
   // In lib/prisma.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });
   ```

2. **Query Optimization**:
   - Review and optimize database queries
   - Add appropriate indexes

## Step 10: Security Considerations

### Environment Variables

- Never commit sensitive environment variables
- Use AWS Systems Manager Parameter Store for sensitive data
- Rotate secrets regularly

### CORS Configuration

```javascript
// In your API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Rate Limiting

Consider implementing rate limiting for API routes:

```javascript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Amplify Console
   - Verify all environment variables are set
   - Ensure Node.js version compatibility

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check RDS security group settings
   - Test connection from a different environment

3. **File Upload Issues**:
   - Verify Cloudinary configuration
   - Check API key permissions
   - Test upload functionality locally

4. **Payment Integration Issues**:
   - Verify Xendit API keys
   - Check webhook URL configuration
   - Test in Xendit sandbox mode first

### Debugging Commands

```bash
# Check build logs
aws amplify get-job --app-id YOUR_APP_ID --branch-name main --job-id JOB_ID

# Test database connection
npx prisma db pull

# Validate environment variables
node -e "console.log(process.env.DATABASE_URL)"
```

## Maintenance

### Regular Tasks

1. **Database Backups**:
   - RDS automatically creates backups
   - Consider additional backup strategies for critical data

2. **Security Updates**:
   - Regularly update dependencies
   - Monitor for security vulnerabilities

3. **Performance Monitoring**:
   - Review CloudWatch metrics regularly
   - Optimize slow queries and API endpoints

### Scaling Considerations

1. **Database Scaling**:
   - Monitor RDS performance metrics
   - Consider read replicas for high traffic

2. **CDN Optimization**:
   - Amplify includes CloudFront CDN
   - Optimize image delivery through Cloudinary

## Cost Optimization

### Amplify Pricing

- **Build minutes**: ~$0.01 per build minute
- **Data transfer**: ~$0.15 per GB
- **Storage**: ~$0.023 per GB per month

### Cost-Saving Tips

1. **Optimize Build Times**:
   - Use efficient caching strategies
   - Minimize dependencies

2. **Database Costs**:
   - Use appropriate RDS instance size
   - Consider Aurora Serverless for variable workloads

3. **Monitoring**:
   - Set up billing alerts
   - Review AWS Cost Explorer regularly

## Support and Resources

### AWS Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Amplify Discord Community](https://discord.gg/amplify)
- [AWS Support](https://aws.amazon.com/support/)

### Application-Specific Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Xendit API Documentation](https://developers.xendit.co/)

---

## Conclusion

This guide provides a comprehensive approach to deploying Dotload on AWS Amplify. The platform offers excellent scalability, built-in CI/CD, and seamless integration with other AWS services.

For production deployments, ensure you:
- Use secure, unique secrets for all environment variables
- Implement proper monitoring and alerting
- Regular backup and disaster recovery procedures
- Follow AWS security best practices

If you encounter issues during deployment, refer to the troubleshooting section or consult the AWS Amplify documentation. 