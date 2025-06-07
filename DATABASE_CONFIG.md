# Database Configuration Guide

This application supports both Supabase and local PostgreSQL databases with automatic fallback.

## Environment Variables

### Supabase Configuration (Production)
```env
# Supabase Database URLs
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Supabase Client Configuration
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Local Development Configuration
```env
# Local PostgreSQL Database
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/alacart
DATABASE_URL=postgresql://postgres:password@localhost:5432/alacart
DIRECT_URL=postgresql://postgres:password@localhost:5432/alacart

# Leave Supabase variables empty for local development
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## How It Works

1. **Supabase Detection**: The system checks for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Database Selection**: 
   - If Supabase is configured and `DATABASE_URL` is set → Uses Supabase
   - Otherwise → Falls back to `LOCAL_DATABASE_URL` or default local PostgreSQL
3. **Prisma Client**: Automatically configured with the appropriate database URL

## Testing Database Connection

Visit `/api/test-db` to verify your database configuration:

```json
{
  "success": true,
  "message": "Database connection successful",
  "userCount": 0,
  "databaseConfig": {
    "isSupabase": true,
    "hasUrl": true,
    "hasDirectUrl": true,
    "supabaseConfigured": true
  }
}
```

## Migration Commands

### For Supabase
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (development)
npx prisma db push

# Create and apply migrations (production)
npx prisma migrate dev --name init
npx prisma migrate deploy
```

### For Local Development
```bash
# Start local PostgreSQL (if using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Generate Prisma client
npx prisma generate

# Push schema to local database
npx prisma db push

# Or use migrations
npx prisma migrate dev --name init
```

## Troubleshooting

1. **Connection Issues**: Check the `/api/test-db` endpoint
2. **Environment Variables**: Ensure all required variables are set
3. **Database Access**: Verify database credentials and network access
4. **Prisma Client**: Run `npx prisma generate` after schema changes

## Current Configuration

The application is currently configured to use:
- **Supabase** when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present
- **Local PostgreSQL** as fallback when Supabase is not configured

This allows seamless switching between development and production environments.