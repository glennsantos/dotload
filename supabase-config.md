# Supabase Database Configuration

## Project Details

- **Project Name**: alacarte-production
- **Project ID**: rekljluyxjjqeggimsnd
- **Region**: us-east-1
- **Status**: ACTIVE_HEALTHY
- **Project URL**: https://rekljluyxjjqeggimsnd.supabase.co

## Database Connection

### Connection String
```postgresql://postgres:[YOUR_PASSWORD]@db.rekljluyxjjqeggimsnd.supabase.co:5432/postgres
```

### Environment Variables for Your Application

Add these to your `.env` file or AWS Amplify environment variables:

```bash
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.rekljluyxjjqeggimsnd.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.rekljluyxjjqeggimsnd.supabase.co:5432/postgres"

# Supabase API Configuration (if needed for direct API access)
NEXT_PUBLIC_SUPABASE_URL="https://rekljluyxjjqeggimsnd.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJla2xqbHV5eGpqcWVnZ2ltc25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwODU5NDEsImV4cCI6MjA2NDY2MTk0MX0.vVAoirLRvRIFGOxohxU0WGVbfnZkti913kXqA3PRcp0"
```

## Database Schema Created

The following tables have been successfully created in your Supabase database:

### Core Application Tables
1. **User** - Main user accounts with authentication and store settings
2. **Product** - Digital and physical products with all marketplace features
3. **File** - File attachments for products
4. **Purchase** - Customer purchase records
5. **FileDownload** - Download tracking and analytics
6. **Variation** - Product variations and options
7. **Payout** - Seller payout management
8. **PasswordReset** - Password reset token management
9. **Transaction** - Financial transaction records

### Legacy/Additional Tables
10. **chat_history** - Chat/support history
11. **users** - Legacy user table (separate from main User table)

## Getting Your Database Password

To get your database password:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **alacarte-production**
3. Go to **Settings** > **Database**
4. Find the **Connection string** section
5. Copy the password from there

## Next Steps

### 1. Update Your Local Environment
Replace `[YOUR_PASSWORD]` in the connection strings above with your actual Supabase database password.

### 2. Test the Connection
Run this command to test your database connection:
```bash
npx prisma db pull
```

### 3. Run Migrations (if needed)
If you have any pending migrations:
```bash
npx prisma migrate deploy
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Seed Data (optional)
If you want to populate with test data:
```bash
pnpm seed
```

## Supabase Dashboard Access

- **Dashboard URL**: https://supabase.com/dashboard/project/rekljluyxjjqeggimsnd
- **Database URL**: https://supabase.com/dashboard/project/rekljluyxjjqeggimsnd/editor

## Features Available

Your Supabase database includes:

- ✅ **PostgreSQL 15** with full SQL support
- ✅ **Automatic backups** (daily)
- ✅ **Real-time subscriptions** (if needed)
- ✅ **Row Level Security** (can be enabled)
- ✅ **Database webhooks** (for integrations)
- ✅ **Connection pooling** (built-in)
- ✅ **SSL encryption** (automatic)

## Cost Information

- **Current Plan**: Free tier
- **Monthly Cost**: $0
- **Includes**: 
  - 500MB database storage
  - 2GB bandwidth
  - 50,000 monthly active users
  - 500,000 Edge Function invocations

## Migration from Current Database

If you want to migrate data from your current database:

1. **Export data** from your current database
2. **Import data** using Supabase SQL editor or pgAdmin
3. **Update environment variables** to point to Supabase
4. **Test thoroughly** before switching production traffic

## Support

- **Supabase Documentation**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

**Note**: Keep your database password secure and never commit it to version control. Use environment variables for all sensitive configuration. 