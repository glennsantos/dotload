# Vercel Deployment Guide

## Prerequisites

1. Vercel CLI installed: `pnpm add -g vercel`
2. Database setup (PostgreSQL)
3. Required third-party services configured

## Environment Variables Required

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
DIRECT_URL=postgresql://username:password@host:port/database
```

### Authentication
```
JWT_SECRET=your_secure_jwt_secret_here
```

### Payment Processing (Xendit)
```
XENDIT_API_KEY=your_xendit_api_key
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_WEBHOOK_SECRET=your_xendit_webhook_secret
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=your_xendit_public_key
```

### Email Configuration (AWS SES)
```
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
EMAIL_FROM=your-app <no-reply@yourdomain.com>
```

### Email Configuration (Resend - Alternative)
```
RESEND_API_KEY=your_resend_api_key
```

### File Storage (Cloudinary)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### Application Settings
```
NODE_ENV=production
DOMAIN=yourdomain.com
PAYOUT_PERCENTAGE_FEE=0.05
PAYOUT_FIXED_FEE=15
```

## Deployment Steps

### 1. Set Environment Variables in Vercel

#### Via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables listed above

#### Via Vercel CLI:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add XENDIT_API_KEY
# ... add all other variables
```

### 2. Database Migration

After setting environment variables, run:
```bash
vercel env pull .env.local
npx prisma generate
npx prisma migrate deploy
```

### 3. Deploy

```bash
vercel --prod
```

## Configuration Files

### vercel.json
The project includes a `vercel.json` configuration file with:
- Build commands
- Function timeout settings
- Regional deployment (Singapore)
- Environment variable settings

### next.config.js
Simplified configuration without complex webpack customizations for better Vercel compatibility.

## Common Issues and Solutions

### 1. Build Failures
- Ensure all environment variables are set
- Check that database is accessible from Vercel
- Verify all dependencies are in package.json

### 2. Runtime Errors
- Check function logs: `vercel logs`
- Ensure JWT_SECRET is properly set
- Verify database connection string format

### 3. File Upload Issues
- Ensure Cloudinary credentials are correct
- Check file size limits in Vercel settings

## Post-Deployment Checklist

- [ ] Database connection working
- [ ] Authentication flow working
- [ ] File uploads working
- [ ] Payment processing working
- [ ] Email sending working
- [ ] All API endpoints responding correctly

## Monitoring

Use Vercel's built-in monitoring:
- Function logs: `vercel logs`
- Performance metrics in dashboard
- Error tracking in Vercel dashboard 