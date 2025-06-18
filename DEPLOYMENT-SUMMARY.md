# Dotload AWS Amplify Deployment Summary

## 🚀 Current Deployment Status

### Active Deployment
- **App Name**: alacart.store
- **App ID**: d2luqrny08trmv
- **Domain**: https://d2luqrny08trmv.amplifyapp.com
- **Current Job**: Job ID 8 - ⏳ PROVISIONING
- **Previous Jobs**: 
  - Job 7: ❌ FAILED (Database migration issue - Fixed)
  - Job 6: ❌ FAILED (Database migration issue)
- **Region**: us-east-1

### Backup App (if needed)
- **App Name**: alacarte-production
- **App ID**: d1hzvaazrfma38
- **Domain**: https://d1hzvaazrfma38.amplifyapp.com
- **Status**: ⏳ Not configured yet

## 🗄️ Database Configuration

### Supabase Production Database
- **Project**: alacarte-production
- **Project ID**: rekljluyxjjqeggimsnd
- **Status**: ✅ ACTIVE_HEALTHY
- **URL**: https://rekljluyxjjqeggimsnd.supabase.co
- **Region**: us-east-1
- **Tables**: ✅ All 11 tables created and configured
- **Migrations**: ✅ Up to date (handled separately from build process)

### Database Tables Created
- User, Product, File, Purchase, FileDownload
- Variation, Payout, PasswordReset, Transaction
- chat_history, users

## 🔧 Environment Variables (Already Configured)

All environment variables are set in the Amplify app:

### Database
```
DATABASE_URL=postgresql://postgres:Um%5Ew%3D4eBmd%7D54_P@db.rekljluyxjjqeggimsnd.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:Um%5Ew%3D4eBmd%7D54_P@db.rekljluyxjjqeggimsnd.supabase.co:5432/postgres
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://rekljluyxjjqeggimsnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication
```
NEXTAUTH_SECRET=l5PHa1wynuDdoTM2K6kPDoDc0hb2SdOtzJ+fJX71T60=
NEXTAUTH_URL=https://d2luqrny08trmv.amplifyapp.com
JWT_SECRET=07975379b0126e5b98990970977b79e973e4c3d0a79211fd2aace81b969378be
DOWNLOAD_SECRET=xtIx98LARho/kpiCGnfyS2yZjet7ly7gfDPrBTusY2I=
```

### File Storage (Cloudinary)
```
CLOUDINARY_CLOUD_NAME=dhgxelj74
CLOUDINARY_API_KEY=978784781551341
CLOUDINARY_API_SECRET=9uScmd1HXSum7NnjaqAcnjch34o
CLOUDINARY_URL=cloudinary://978784781551341:9uScmd1HXSum7NnjaqAcnjch34o@dhgxelj74
```

### Payment Processing (Xendit)
```
XENDIT_API_KEY=xnd_development_3c617WmgPgtSXUNmFQd2tgJd528apZVdO4MuQlwgrVkRNS8nfyfiTL05bT5
XENDIT_SECRET_KEY=xnd_development_3c617WmgPgtSXUNmFQd2tgJd528apZVdO4MuQlwgrVkRNS8nfyfiTL05bT5
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_development_vQs7kQ9nzzwOK6ySLSvWBMGxJpiMWrYDJhqn1D3TgFMcsvS9Caj2EiCaIcyGs5rp
XENDIT_WEBHOOK_SECRET=9e4bd5157df504c2db17e2824875b2df37fb413f8f96b0af0a9bb489b431fe59
```

### Email Service (Resend)
```
RESEND_API_KEY=re_EjthFeC2_FyAB6yfniVS4w4j3enttrSWz
EMAIL_FROM=alacart.store <alacart@memokitchen.com>
```

### Application Settings
```
NODE_ENV=production
DOMAIN=d2luqrny08trmv.amplifyapp.com
UPLOADS_DIR=/tmp/uploads
PAYOUT_PERCENTAGE_FEE=0.05
PAYOUT_FIXED_FEE=15
```

## 🔗 Repository Configuration

- **Repository**: https://github.com/adaptive-ai-labs/alacart.store
- **Branch**: amplify-deployment
- **Build Spec**: Updated to skip database migrations during build

## 📋 Build Configuration

The `amplify.yml` has been optimized for production:
- Uses pnpm for faster installs
- Generates Prisma client
- Skips database migrations during build (handled separately)
- Proper caching for node_modules and .next

## ✅ Deployment Checklist

### Completed ✅
- [x] Amplify app created and configured
- [x] Supabase database created and tables set up
- [x] All environment variables configured
- [x] Build specification optimized
- [x] Repository connected
- [x] Current deployment running

### Next Steps
- [ ] Wait for current deployment to complete
- [ ] Test the application functionality
- [ ] Set up custom domain (optional)
- [ ] Configure production API keys (replace development keys)

## 🚨 Important Notes

1. **Database Migrations**: They're skipped during build. All tables are already created in Supabase.

2. **Development Keys**: Currently using development API keys for Xendit. Replace with production keys when ready.

3. **Domain**: Currently using the default Amplify domain. Can be customized later.

4. **SSL**: Handled automatically by Amplify.

## 📞 Support Resources

- **Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2luqrny08trmv
- **Supabase Dashboard**: https://supabase.com/dashboard/project/rekljluyxjjqeggimsnd
- **GitHub Repository**: https://github.com/adaptive-ai-labs/alacart.store

## 🔄 Redeployment

To trigger a new deployment:
```bash
aws amplify start-job --app-id d2luqrny08trmv --branch-name amplify-deployment --job-type RELEASE
```

## 📊 Cost Optimization

- **Supabase**: Free tier (0 cost)
- **Amplify**: Pay-per-use hosting
- **Cloudinary**: Check usage limits
- **Xendit**: Development mode (no fees)
- **Resend**: Check email sending limits 