# Dotload - Data Flow Documentation

> **Version:** 1.0.0
> **Created:** 2025-11-19
> **Purpose:** Comprehensive data flow diagrams showing how data moves through the Dotload platform

---

## Table of Contents

1. [System Data Flow Overview](#system-data-flow-overview)
2. [User Authentication Data Flows](#user-authentication-data-flows)
3. [Product Management Data Flows](#product-management-data-flows)
4. [Purchase and Payment Data Flows](#purchase-and-payment-data-flows)
5. [File Upload and Download Data Flows](#file-upload-and-download-data-flows)
6. [Payout Data Flows](#payout-data-flows)
7. [Email Notification Data Flows](#email-notification-data-flows)
8. [Dashboard Analytics Data Flows](#dashboard-analytics-data-flows)
9. [External Service Integration Data Flows](#external-service-integration-data-flows)
10. [State Management Data Flows](#state-management-data-flows)

---

## System Data Flow Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (UI)                                   │   │
│  │  - State: useState, useContext                           │   │
│  │  - Forms: React Hook Form                                │   │
│  │  - HTTP: fetch API                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
                   HTTPS (JSON/FormData)
                   Cookie (JWT Token)
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS MIDDLEWARE                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JWT Verification & Route Protection                     │   │
│  │  Input: Cookie['token']                                  │   │
│  │  Output: Allow/Redirect                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION (Server)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (/app/api/**/route.ts)                       │   │
│  │  - Request validation (Zod)                              │   │
│  │  - Business logic                                        │   │
│  │  - Response formatting                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Layer (/lib/*.ts)                               │   │
│  │  - supabaseUserService                                   │   │
│  │  - supabaseProductService                                │   │
│  │  - supabasePurchaseService                               │   │
│  │  - emailService                                          │   │
│  │  - xenditClient                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    ↓ ↑           ↓ ↑           ↓ ↑
            ┌───────┘ └───────┐   │ │   ┌───────┘ └───────┐
            │                 │   │ │   │                 │
         PostgreSQL        Xendit │ │ Cloudinary      Resend
         (Supabase)      (Payments)│ │ (Files)        (Email)
                                   │ │
                            AWS SES │ │ (Email Backup)
                                   └─┘
```

### Data Flow Patterns

**Pattern 1: Client → API → Database → Client**
```
Client Request
    ↓ (JSON)
API Route validates
    ↓
Service Layer queries
    ↓ (SQL)
Database returns
    ↑ (Rows)
Service formats
    ↑
API returns JSON
    ↑ (JSON)
Client renders UI
```

**Pattern 2: Client → API → External Service → Webhook**
```
Client initiates payment
    ↓ (JSON)
API creates payment
    ↓ (API Call)
Xendit processes
    ↓ (Async)
Xendit sends webhook
    ↓ (HTTP POST)
API updates database
    ↑
Client polls or receives notification
```

---

## User Authentication Data Flows

### 1.1 Registration Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Submits Registration Form                         │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  User fills form:
  {
    email: "user@example.com",
    password: "SecurePass123",
    name: "John Doe"
  }
    ↓ (Client-side validation: React Hook Form + Zod)
    ↓ Validation passes
    ↓
  POST /api/auth/register
  Content-Type: application/json
  Body: {
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }
    ↓ HTTPS
    ↓
[Next.js API Route: /app/api/auth/register/route.ts]
    ↓
  1. Parse request body
     const body = await request.json()
    ↓
  2. Validate with Zod schema
     const validated = registerSchema.parse(body)
    ↓ If invalid → return 400 with errors
    ↓ If valid → continue
    ↓
  3. Check if email exists
     Query Database:
     ┌─────────────────────────────────────┐
     │ SELECT * FROM User                  │
     │ WHERE email = 'user@example.com'    │
     └─────────────────────────────────────┘
    ↓
[Supabase/PostgreSQL]
    ↓
  Result: null (email available)
    ↑
  4. Hash password
     const hash = await bcryptjs.hash(password, 10)
     Result: "$2a$10$abcdef..."
    ↓
  5. Generate verification token
     const token = crypto.randomBytes(32).toString('hex')
     Result: "abc123def456..."
    ↓
  6. Create user record
     Query Database:
     ┌─────────────────────────────────────┐
     │ INSERT INTO User (                  │
     │   id, email, password, name,        │
     │   emailVerified, verificationToken, │
     │   createdAt, updatedAt              │
     │ ) VALUES (                          │
     │   'clx123', 'user@example.com',     │
     │   '$2a$10$...', 'John Doe',         │
     │   false, 'abc123...', NOW(), NOW()  │
     │ )                                   │
     │ RETURNING *                         │
     └─────────────────────────────────────┘
    ↓
[Supabase/PostgreSQL]
    ↓
  Result: { id: 'clx123', email: '...', ... }
    ↑
  7. Send verification email
     Call emailService.sendVerificationEmail()
    ↓
[Email Service: /lib/email.ts]
    ↓
  Construct email data:
  {
    from: "Dotload <no-reply@dotload.com>",
    to: "user@example.com",
    subject: "Verify your email",
    html: "<html>...</html>",
    verificationUrl: "https://dotload.com/verify-email?token=abc123..."
  }
    ↓
  Try Resend API:
    ↓ HTTPS POST
    ↓
[Resend API]
    ↓
  Queue email for delivery
    ↑
  Response: { id: "email_123", status: "queued" }
    ↑
[API Route]
    ↓
  8. Return success response
     Response:
     Status: 201 Created
     Body: {
       "message": "Registration successful",
       "user": {
         "id": "clx123",
         "email": "user@example.com",
         "name": "John Doe"
       }
     }
    ↑ HTTPS
    ↑
[Browser]
  Receives response
    ↓
  Update UI:
  - Redirect to /verify-email
  - Show success toast
  - Display "Check your email" message

┌─────────────────────────────────────────────────────────────────┐
│ Data Entities Created                                           │
└─────────────────────────────────────────────────────────────────┘

Database:
  User {
    id: "clx123",
    email: "user@example.com",
    password: "$2a$10$...", (hashed)
    name: "John Doe",
    emailVerified: false,
    verificationToken: "abc123...",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z"
  }

Email Queue (Resend):
  Email {
    id: "email_123",
    to: "user@example.com",
    status: "queued",
    scheduledFor: "immediate"
  }
```

**Data Transformations:**
1. Plain password → Bcrypt hash
2. User input → Validated DTO
3. Database row → API response DTO (password excluded)
4. Verification token → Email URL parameter

**Data Validation Layers:**
1. Client-side: React Hook Form + Zod
2. Server-side: Zod schema validation
3. Database: Unique constraint on email
4. Business logic: Email format, password strength

---

### 1.2 Login Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Submits Login Credentials                         │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  User submits:
  {
    email: "user@example.com",
    password: "SecurePass123"
  }
    ↓
  POST /api/auth/login
  Body: { email, password }
    ↓
[API Route: /app/api/auth/login/route.ts]
    ↓
  1. Query user by email
     ┌─────────────────────────────────────┐
     │ SELECT * FROM User                  │
     │ WHERE email = 'user@example.com'    │
     └─────────────────────────────────────┘
    ↓
[Database]
    ↑
  Result:
  {
    id: "clx123",
    email: "user@example.com",
    password: "$2a$10$abcdef...",
    emailVerified: true,
    ...
  }
    ↑
  2. Compare passwords
     bcryptjs.compare(
       inputPassword: "SecurePass123",
       storedHash: "$2a$10$abcdef..."
     )
     → Result: true (match)
    ↓
  3. Check email verified
     if (!user.emailVerified)
       return 403 "Email not verified"
    ↓
  4. Generate JWT token
     Payload:
     {
       userId: "clx123",
       email: "user@example.com"
     }
     ↓
     Sign with JWT_SECRET
     Algorithm: HS256
     Expiry: 24 hours
     ↓
     Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    ↓
  5. Set HTTP-only cookie
     Set-Cookie header:
     token=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Max-Age=86400; Path=/
    ↓
  6. Return user data (password excluded)
     Response:
     Status: 200 OK
     Headers:
       Set-Cookie: token=eyJhbG...
     Body: {
       "message": "Login successful",
       "user": {
         "id": "clx123",
         "email": "user@example.com",
         "name": "John Doe"
       }
     }
    ↑
[Browser]
  - Cookie stored automatically
  - User data saved to React state
  - Redirect to /dashboard

┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Subsequent Authenticated Requests                      │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  Navigate to /dashboard
    ↓
  GET /dashboard
  Headers:
    Cookie: token=eyJhbG...
    ↓
[Next.js Middleware: /middleware.ts]
    ↓
  1. Extract token from cookie
     const token = request.cookies.get('token')?.value
    ↓
  2. Verify JWT
     jwtVerify(token, JWT_SECRET)
     ↓
     Decode payload:
     {
       userId: "clx123",
       email: "user@example.com",
       iat: 1705315200,
       exp: 1705401600
     }
    ↓
  3. Check expiration
     if (now > exp)
       return redirect('/login')
    ↓
  4. Allow request to continue
     NextResponse.next()
    ↓
[Dashboard Page]
  - User ID available from JWT
  - Fetch user-specific data
```

**Data Flow Characteristics:**
- **Stateless Authentication**: JWT contains all auth info
- **Security**: Password never stored in plain text or sent in response
- **Performance**: No database query on every request (JWT verification only)

---

## Product Management Data Flows

### 2.1 Product Creation Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Upload Cover Image                                     │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  User selects image file:
  File: cover.jpg (2.5 MB)
    ↓
  Convert to FormData:
  formData.append('file', coverImage)
  formData.append('folder', 'dotload/products')
    ↓
  POST /api/upload
  Content-Type: multipart/form-data
  Body: FormData
    ↓
[API Route: /app/api/upload/route.ts]
    ↓
  1. Extract file from form data
     const file = formData.get('file')
     File info:
     - name: "cover.jpg"
     - type: "image/jpeg"
     - size: 2621440 bytes
    ↓
  2. Convert to buffer
     const bytes = await file.arrayBuffer()
     const buffer = Buffer.from(bytes)
    ↓
  3. Upload to Cloudinary
     cloudinary.uploader.upload_stream({
       folder: 'dotload/products',
       resource_type: 'auto'
     })
    ↓ HTTPS (Multipart upload)
    ↓
[Cloudinary CDN]
  - Processes image
  - Generates thumbnails
  - Optimizes format
  - Stores on CDN
    ↑
  Response:
  {
    secure_url: "https://res.cloudinary.com/.../cover.jpg",
    public_id: "dotload/products/abc123",
    format: "jpg",
    bytes: 2621440,
    width: 1920,
    height: 1080
  }
    ↑
[API Route]
    ↑
  Return to client:
  {
    "url": "https://res.cloudinary.com/.../cover.jpg",
    "publicId": "dotload/products/abc123"
  }
    ↑
[Browser]
  - Store URL in form state
  - Display preview

┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Upload Digital Files (Repeat for each file)            │
└─────────────────────────────────────────────────────────────────┘

Same flow as cover image, stored URLs:
[
  "https://res.cloudinary.com/.../course.pdf",
  "https://res.cloudinary.com/.../assets.zip"
]

┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Submit Product Data                                    │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  Aggregate all form data:
  {
    name: "Premium Course",
    description: "<p>Full course...</p>",
    price: 999.00,
    coverImagePath: "https://cloudinary.com/.../cover.jpg",
    fileUrls: ["https://cloudinary.com/.../course.pdf", ...],
    variations: [
      { name: "License", options: ["Personal", "Commercial"] }
    ],
    downloadLimit: 3,
    linkExpiration: 7
  }
    ↓
  POST /api/products
  Body: JSON
    ↓
[API Route: /app/api/products/route.ts]
    ↓
  1. Extract user ID from JWT
     const { userId } = await verifyToken(request)
    ↓
  2. Validate product data
     const validated = productSchema.parse(body)
    ↓
  3. Generate unique slug
     slug = slugify(name) // "premium-course"
     ↓
     Check uniqueness:
     ┌─────────────────────────────────────┐
     │ SELECT COUNT(*) FROM Product        │
     │ WHERE slug = 'premium-course'       │
     └─────────────────────────────────────┘
     ↓
     If exists, append suffix: "premium-course-2"
    ↓
  4. Create Product record
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO Product (                                │
     │   id, userId, name, slug, price, description,        │
     │   coverImagePath, downloadLimit, linkExpiration,     │
     │   createdAt, updatedAt                               │
     │ ) VALUES (                                           │
     │   'clx456', 'user123', 'Premium Course',             │
     │   'premium-course', 999.00, '<p>...</p>',            │
     │   'https://cloudinary.com/...', 3, 7,                │
     │   NOW(), NOW()                                       │
     │ )                                                    │
     │ RETURNING *                                          │
     └──────────────────────────────────────────────────────┘
    ↓
[Database]
    ↑
  Product created:
  {
    id: "clx456",
    userId: "user123",
    name: "Premium Course",
    slug: "premium-course",
    price: 999.00,
    ...
  }
    ↑
  5. Create File records
     For each fileUrl:
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO File (                                   │
     │   id, productId, filename, path, mimetype, size      │
     │ ) VALUES (                                           │
     │   'file1', 'clx456', 'course.pdf',                   │
     │   'https://cloudinary.com/...', 'application/pdf',   │
     │   52428800                                           │
     │ )                                                    │
     └──────────────────────────────────────────────────────┘
    ↓
  6. Create Variation records
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO Variation (                              │
     │   id, productId, name, options                       │
     │ ) VALUES (                                           │
     │   'var1', 'clx456', 'License',                       │
     │   '["Personal", "Commercial"]'                       │
     │ )                                                    │
     └──────────────────────────────────────────────────────┘
    ↓
  7. Return complete product
     Response:
     {
       "message": "Product created",
       "product": {
         "id": "clx456",
         "slug": "premium-course",
         "name": "Premium Course",
         "price": 999.00,
         "files": [...],
         "variations": [...]
       }
     }
    ↑
[Browser]
  - Show success message
  - Redirect to /products/clx456 or /p/premium-course

┌─────────────────────────────────────────────────────────────────┐
│ Data Entities Created                                           │
└─────────────────────────────────────────────────────────────────┘

Database Tables:
1. Product (1 row)
2. File (2 rows - course.pdf, assets.zip)
3. Variation (1 row - License options)

Cloudinary Storage:
1. dotload/products/abc123.jpg (cover)
2. dotload/files/def456.pdf (course)
3. dotload/files/ghi789.zip (assets)

Total Data:
- Database: ~2 KB (metadata)
- Cloudinary: 54 MB (files)
```

**Data Relationships:**
```
Product (id: clx456)
  ├─→ File (productId: clx456, id: file1)
  ├─→ File (productId: clx456, id: file2)
  └─→ Variation (productId: clx456, id: var1)
```

---

## Purchase and Payment Data Flows

### 3.1 Complete Purchase Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Customer Submits Checkout Form                         │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  Form data:
  {
    productId: "clx456",
    email: "buyer@example.com",
    mobileNumber: "+639171234567",
    paymentMethod: "eWallet",
    amount: 999.00,
    variation: "Commercial"
  }
    ↓
  POST /api/payments/create
    ↓
[API Route: /app/api/payments/create/route.ts]
    ↓
  1. Fetch product details
     ┌─────────────────────────────────────┐
     │ SELECT p.*, u.name, u.email         │
     │ FROM Product p                      │
     │ JOIN User u ON p.userId = u.id      │
     │ WHERE p.id = 'clx456'               │
     └─────────────────────────────────────┘
    ↓
[Database]
    ↑
  Product data:
  {
    id: "clx456",
    name: "Premium Course",
    price: 999.00,
    userId: "seller123",
    seller: {
      name: "John's Store",
      email: "seller@example.com"
    }
  }
    ↑
  2. Generate access code
     const accessCode = crypto.randomBytes(8).toString('hex').toUpperCase()
     Result: "ABC123XYZ456"
    ↓
  3. Create Purchase record
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO Purchase (                               │
     │   id, productId, email, mobileNumber,                │
     │   amount, paymentMethod, status, accessCode,         │
     │   createdAt, updatedAt                               │
     │ ) VALUES (                                           │
     │   'pur123', 'clx456', 'buyer@example.com',           │
     │   '+639171234567', 999.00, 'eWallet', 'pending',     │
     │   'ABC123XYZ456', NOW(), NOW()                       │
     │ )                                                    │
     │ RETURNING *                                          │
     └──────────────────────────────────────────────────────┘
    ↓
[Database]
    ↑
  Purchase created:
  {
    id: "pur123",
    status: "pending",
    accessCode: "ABC123XYZ456",
    ...
  }

┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Create Payment via Xendit                              │
└─────────────────────────────────────────────────────────────────┘

[API Route]
    ↓
  4. Call Xendit API
     xenditClient.EWallet.createEWalletCharge({
       referenceId: "pur123",
       currency: "PHP",
       amount: 999.00,
       channelCode: "ID_OVO",
       channelProperties: {
         successRedirectUrl: "https://dotload.com/p/premium-course/success?code=ABC123XYZ456",
         failureRedirectUrl: "https://dotload.com/p/premium-course/failure"
       },
       customer: {
         email: "buyer@example.com",
         mobileNumber: "+639171234567"
       }
     })
    ↓ HTTPS POST
    ↓
[Xendit API]
  - Validates request
  - Creates charge
  - Generates checkout URL
    ↑
  Response:
  {
    id: "ewc_abc123",
    status: "PENDING",
    amount: 999,
    actions: {
      mobile_web_checkout_url: "https://checkout.xendit.co/web/ewc_abc123"
    }
  }
    ↑
[API Route]
    ↓
  5. Update Purchase with payment ID
     ┌─────────────────────────────────────┐
     │ UPDATE Purchase                     │
     │ SET paymentId = 'ewc_abc123'        │
     │ WHERE id = 'pur123'                 │
     └─────────────────────────────────────┘
    ↓
  6. Return redirect URL to client
     Response:
     {
       "purchase": {
         "id": "pur123",
         "accessCode": "ABC123XYZ456"
       },
       "redirectUrl": "https://checkout.xendit.co/web/ewc_abc123"
     }
    ↑
[Browser]
  Redirect to Xendit checkout:
  window.location.href = response.redirectUrl

┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Customer Pays on Xendit (External)                     │
└─────────────────────────────────────────────────────────────────┘

[Customer]
  - Opens Xendit checkout page
  - Selects GCash
  - Redirected to GCash app
  - Authenticates and confirms payment
    ↓
[GCash / Bank]
  - Processes payment
  - Sends confirmation to Xendit
    ↓
[Xendit]
  Payment status: PENDING → SUCCEEDED
    ↓
  Redirect customer:
  https://dotload.com/p/premium-course/success?code=ABC123XYZ456
    ↓
  Send webhook to merchant

┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Webhook Updates Purchase Status (Async)                │
└─────────────────────────────────────────────────────────────────┘

[Xendit]
  POST /api/payments/webhook
  Headers:
    x-callback-token: "webhook_secret_xyz"
  Body:
  {
    id: "ewc_abc123",
    external_id: "pur123",
    status: "SUCCEEDED",
    amount: 999,
    payment_method: "EWALLET",
    ewallet_type: "GCASH",
    paid_at: "2025-01-15T10:35:00Z"
  }
    ↓
[API Route: /app/api/payments/webhook/route.ts]
    ↓
  1. Verify webhook signature
     if (headers['x-callback-token'] !== WEBHOOK_SECRET)
       return 401
    ↓
  2. Find purchase
     ┌─────────────────────────────────────┐
     │ SELECT * FROM Purchase              │
     │ WHERE id = 'pur123'                 │
     └─────────────────────────────────────┘
    ↓
  3. Update purchase status
     ┌─────────────────────────────────────┐
     │ UPDATE Purchase                     │
     │ SET status = 'completed',           │
     │     updatedAt = NOW()               │
     │ WHERE id = 'pur123'                 │
     └─────────────────────────────────────┘
    ↓
  4. Create transaction record
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO Transaction (                            │
     │   id, userId, amount, type, status, reference,       │
     │   metadata, createdAt                                │
     │ ) VALUES (                                           │
     │   UUID(), 'seller123', 999.00, 'sale', 'completed',  │
     │   'ewc_abc123',                                      │
     │   '{"purchaseId":"pur123","method":"GCASH"}',        │
     │   NOW()                                              │
     │ )                                                    │
     └──────────────────────────────────────────────────────┘
    ↓
  5. Send confirmation emails
     → sendPurchaseConfirmationEmail(buyer)
     → sendNewSaleNotificationEmail(seller)
    ↓
  6. Return 200 OK to Xendit

┌─────────────────────────────────────────────────────────────────┐
│ Data State After Purchase                                      │
└─────────────────────────────────────────────────────────────────┘

Database State:

Purchase {
  id: "pur123",
  productId: "clx456",
  email: "buyer@example.com",
  mobileNumber: "+639171234567",
  amount: 999.00,
  paymentMethod: "eWallet",
  paymentId: "ewc_abc123",
  status: "completed", ← Updated by webhook
  accessCode: "ABC123XYZ456",
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-01-15T10:35:00Z"
}

Transaction {
  id: "trans_uuid",
  userId: "seller123",
  amount: 999.00,
  type: "sale",
  status: "completed",
  reference: "ewc_abc123",
  metadata: {
    "purchaseId": "pur123",
    "method": "GCASH"
  },
  createdAt: "2025-01-15T10:35:00Z"
}

Xendit State:
EWalletCharge {
  id: "ewc_abc123",
  status: "SUCCEEDED",
  amount: 999,
  referenceId: "pur123",
  paidAt: "2025-01-15T10:35:00Z"
}

Email Queue:
- Buyer confirmation email (sent)
- Seller notification email (sent)
```

**Data Flow Summary:**
1. **Client → API**: Checkout form data
2. **API → Database**: Create pending purchase
3. **API → Xendit**: Create payment charge
4. **Xendit → Client**: Redirect to checkout
5. **Client → Xendit**: Complete payment
6. **Xendit → API**: Webhook notification
7. **API → Database**: Update purchase status
8. **API → Email Service**: Send confirmations

---

## File Upload and Download Data Flows

### 4.1 Secure File Download Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer Downloads File                                         │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  GET /api/downloads/secure?accessCode=ABC123XYZ456
    ↓
[API Route: /app/api/downloads/secure/route.ts]
    ↓
  1. Validate access code
     ┌─────────────────────────────────────────────────┐
     │ SELECT p.*, pr.*, f.*                           │
     │ FROM Purchase p                                 │
     │ JOIN Product pr ON p.productId = pr.id          │
     │ JOIN File f ON pr.id = f.productId              │
     │ WHERE p.accessCode = 'ABC123XYZ456'             │
     │   AND p.status = 'completed'                    │
     └─────────────────────────────────────────────────┘
    ↓
[Database]
    ↑
  Result:
  {
    purchase: {
      id: "pur123",
      status: "completed",
      createdAt: "2025-01-15T10:30:00Z"
    },
    product: {
      downloadLimit: 3,
      linkExpiration: 7
    },
    files: [
      {
        id: "file1",
        filename: "course.pdf",
        path: "https://res.cloudinary.com/.../course.pdf",
        size: 52428800
      }
    ]
  }
    ↑
  2. Check download limit
     ┌─────────────────────────────────────┐
     │ SELECT COUNT(*) FROM FileDownload   │
     │ WHERE purchaseId = 'pur123'         │
     └─────────────────────────────────────┘
    ↓
  Result: 2 downloads (limit: 3) → OK
    ↓
  3. Check link expiration
     expiryDate = createdAt + linkExpiration days
     expiryDate = 2025-01-15 + 7 = 2025-01-22
     currentDate = 2025-01-20
     → Not expired, OK
    ↓
  4. Log download
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO FileDownload (                           │
     │   id, fileId, purchaseId, downloadedAt,              │
     │   userAgent, ipAddress, metadata                     │
     │ ) VALUES (                                           │
     │   UUID(), 'file1', 'pur123', NOW(),                  │
     │   'Mozilla/5.0...', '123.45.67.89',                  │
     │   '{"browser":"Chrome","os":"Windows"}'              │
     │ )                                                    │
     └──────────────────────────────────────────────────────┘
    ↓
  5. Fetch file from Cloudinary
     GET https://res.cloudinary.com/.../course.pdf
    ↓
[Cloudinary CDN]
    ↑
  Response: File stream (50 MB)
    ↑
[API Route]
    ↓
  6. Stream to client
     Response:
     Status: 200 OK
     Headers:
       Content-Type: application/pdf
       Content-Disposition: attachment; filename="course.pdf"
       Content-Length: 52428800
     Body: [File stream]
    ↑
[Browser]
  - Download dialog appears
  - File saves to Downloads folder

┌─────────────────────────────────────────────────────────────────┐
│ Download Tracking Data                                         │
└─────────────────────────────────────────────────────────────────┘

FileDownload {
  id: "download_uuid",
  fileId: "file1",
  purchaseId: "pur123",
  userId: null,
  downloadedAt: "2025-01-20T14:30:00Z",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
  ipAddress: "123.45.67.89",
  metadata: {
    "browser": "Chrome",
    "os": "Windows 10",
    "device": "Desktop",
    "referrer": "https://dotload.com/p/premium-course/success"
  }
}
```

**Data Protection Mechanisms:**
1. Access code validation (unique, unguessable)
2. Purchase status check (must be completed)
3. Download limit enforcement (database count)
4. Link expiration validation (date arithmetic)
5. Activity logging (audit trail)

---

## Payout Data Flows

### 5.1 Payout Request Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Seller Requests Payout                                         │
└─────────────────────────────────────────────────────────────────┘

[Browser]
  POST /api/payouts
  Body:
  {
    amount: 15000.00,
    bankCode: "BDO",
    accountNumber: "1234567890",
    accountHolderName: "Juan Dela Cruz"
  }
    ↓
[API Route: /app/api/payouts/route.ts]
    ↓
  1. Calculate available balance
     ┌─────────────────────────────────────────────────────┐
     │ -- Total revenue from completed sales               │
     │ SELECT SUM(p.amount) as revenue                     │
     │ FROM Purchase p                                     │
     │ JOIN Product pr ON p.productId = pr.id              │
     │ WHERE pr.userId = 'seller123'                       │
     │   AND p.status = 'completed'                        │
     └─────────────────────────────────────────────────────┘
    ↓
  Result: revenue = 50,000.00
    ↓
     ┌─────────────────────────────────────────────────────┐
     │ -- Total payouts (completed + pending)              │
     │ SELECT SUM(amount) as payouts                       │
     │ FROM Payout                                         │
     │ WHERE userId = 'seller123'                          │
     │   AND status IN ('COMPLETED', 'PENDING')            │
     └─────────────────────────────────────────────────────┘
    ↓
  Result: payouts = 30,000.00
    ↓
  availableBalance = revenue - payouts
                   = 50,000 - 30,000
                   = 20,000.00
    ↓
  Validate: requestedAmount (15,000) <= availableBalance (20,000)
  → OK
    ↓
  2. Calculate fees
     percentageFee = 15,000 × 0.05 = 750.00
     fixedFee = 15.00
     netAmount = 15,000 - 750 - 15 = 14,235.00
    ↓
  3. Create Payout record
     ┌──────────────────────────────────────────────────────┐
     │ INSERT INTO Payout (                                 │
     │   id, userId, amount, status, bankCode,              │
     │   accountNumber, accountHolderName, createdAt        │
     │ ) VALUES (                                           │
     │   UUID(), 'seller123', 15000.00, 'PENDING',          │
     │   'BDO', '1234567890', 'Juan Dela Cruz', NOW()       │
     │ )                                                    │
     │ RETURNING *                                          │
     └──────────────────────────────────────────────────────┘
    ↓
[Database]
    ↑
  Payout created: { id: "payout_uuid", ... }
    ↑
  4. Call Xendit Disbursement API
     xenditClient.Disbursement.create({
       externalId: "payout_uuid",
       amount: 14235.00,
       bankCode: "BDO",
       accountHolderName: "Juan Dela Cruz",
       accountNumber: "1234567890"
     })
    ↓
[Xendit API]
  - Validates bank details
  - Queues disbursement
    ↑
  Response:
  {
    id: "disb_abc123",
    externalId: "payout_uuid",
    status: "PENDING",
    amount: 14235
  }
    ↑
  5. Update Payout with Xendit IDs
     ┌─────────────────────────────────────┐
     │ UPDATE Payout                       │
     │ SET externalId = 'payout_uuid',     │
     │     disbursementId = 'disb_abc123'  │
     │ WHERE id = 'payout_uuid'            │
     └─────────────────────────────────────┘
    ↓
  6. Return success
     Response:
     {
       "payout": {
         "id": "payout_uuid",
         "amount": 15000.00,
         "netAmount": 14235.00,
         "status": "PENDING"
       }
     }

┌─────────────────────────────────────────────────────────────────┐
│ Payout Processing (Async via Webhook)                          │
└─────────────────────────────────────────────────────────────────┘

[Xendit]
  Processes disbursement (1-3 business days)
    ↓
  POST /api/payouts/webhook
  Body:
  {
    id: "disb_abc123",
    external_id: "payout_uuid",
    status: "COMPLETED",
    updated: "2025-01-17T09:30:00Z"
  }
    ↓
[API Route]
    ↓
  Update Payout status
     ┌─────────────────────────────────────┐
     │ UPDATE Payout                       │
     │ SET status = 'COMPLETED',           │
     │     updatedAt = NOW()               │
     │ WHERE id = 'payout_uuid'            │
     └─────────────────────────────────────┘
    ↓
  Send email notification to seller
```

**Data State Transitions:**
```
Payout Status Flow:
PENDING → PROCESSING → COMPLETED
              ↓
           FAILED (if error)
```

---

## Email Notification Data Flows

### 6.1 Email Sending Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Email Trigger → Send → Delivery                                │
└─────────────────────────────────────────────────────────────────┘

[Application Event]
  e.g., Purchase completed
    ↓
  emailService.sendPurchaseConfirmation({
    to: "buyer@example.com",
    productName: "Premium Course",
    accessCode: "ABC123XYZ456",
    downloadUrl: "https://..."
  })
    ↓
[Email Service: /lib/email.ts]
    ↓
  1. Construct email data
     {
       from: "Dotload <no-reply@dotload.com>",
       to: "buyer@example.com",
       subject: "Your purchase of Premium Course",
       html: `
         <h1>Purchase Successful!</h1>
         <p>Thank you for purchasing Premium Course.</p>
         <a href="${downloadUrl}">Download Now</a>
         <p>Access Code: ${accessCode}</p>
       `
     }
    ↓
  2. Try Resend API (Primary)
     resend.emails.send(emailData)
    ↓ HTTPS POST to api.resend.com
    ↓
[Resend API]
  - Validates email format
  - Checks SPF/DKIM
  - Queues email
    ↑
  Response:
  {
    id: "email_abc123",
    from: "no-reply@dotload.com",
    to: "buyer@example.com",
    created_at: "2025-01-15T10:35:00Z"
  }
    ↑
[Email Service]
  Log success
    ↓
  If Resend fails:
    ↓
  3. Fallback to AWS SES
     sesClient.sendEmail(emailData)
    ↓
[AWS SES]
  - Process email
  - Deliver via SMTP
    ↑
  Response: { MessageId: "msg_xyz" }
    ↑
  4. Email delivered to recipient
    ↓
[Recipient Email Provider]
  - Spam filtering
  - Inbox delivery

┌─────────────────────────────────────────────────────────────────┐
│ Email Metadata Stored                                          │
└─────────────────────────────────────────────────────────────────┘

Optional: EmailLog table (future enhancement)
{
  id: "log_uuid",
  type: "purchase_confirmation",
  to: "buyer@example.com",
  subject: "Your purchase of Premium Course",
  provider: "resend",
  externalId: "email_abc123",
  status: "sent",
  sentAt: "2025-01-15T10:35:00Z",
  metadata: {
    purchaseId: "pur123",
    productId: "clx456"
  }
}
```

---

## Dashboard Analytics Data Flows

### 7.1 Dashboard Metrics Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│ Load Dashboard Data (Server-Side)                              │
└─────────────────────────────────────────────────────────────────┘

[Next.js Server Component: /app/dashboard/page.tsx]
    ↓
  Execute parallel queries:
  Promise.all([
    getProductCount(userId),
    getTotalSales(userId),
    getTotalRevenue(userId),
    getCustomerCount(userId),
    getSalesByDate(userId, 30)
  ])
    ↓
[Database Queries]

Query 1: Product Count
┌─────────────────────────────────────┐
│ SELECT COUNT(*) as count            │
│ FROM Product                        │
│ WHERE userId = 'seller123'          │
│   AND status = 'active'             │
└─────────────────────────────────────┘
Result: { count: 15 }

Query 2: Total Sales
┌─────────────────────────────────────┐
│ SELECT COUNT(*) as count            │
│ FROM Purchase p                     │
│ JOIN Product pr ON p.productId = pr.id │
│ WHERE pr.userId = 'seller123'       │
│   AND p.status = 'completed'        │
└─────────────────────────────────────┘
Result: { count: 120 }

Query 3: Total Revenue
┌─────────────────────────────────────┐
│ SELECT SUM(p.amount) as revenue     │
│ FROM Purchase p                     │
│ JOIN Product pr ON p.productId = pr.id │
│ WHERE pr.userId = 'seller123'       │
│   AND p.status = 'completed'        │
└─────────────────────────────────────┘
Result: { revenue: 150000.00 }

Query 4: Unique Customers
┌─────────────────────────────────────┐
│ SELECT COUNT(DISTINCT p.email)      │
│ FROM Purchase p                     │
│ JOIN Product pr ON p.productId = pr.id │
│ WHERE pr.userId = 'seller123'       │
│   AND p.status = 'completed'        │
└─────────────────────────────────────┘
Result: { count: 85 }

Query 5: Sales by Date (Last 30 days)
┌──────────────────────────────────────────────────────┐
│ SELECT                                               │
│   DATE(p.createdAt) as date,                         │
│   COUNT(*) as sales,                                 │
│   SUM(p.amount) as revenue                           │
│ FROM Purchase p                                      │
│ JOIN Product pr ON p.productId = pr.id               │
│ WHERE pr.userId = 'seller123'                        │
│   AND p.status = 'completed'                         │
│   AND p.createdAt >= NOW() - INTERVAL '30 days'     │
│ GROUP BY DATE(p.createdAt)                           │
│ ORDER BY date ASC                                    │
└──────────────────────────────────────────────────────┘
Result:
[
  { date: "2025-01-01", sales: 5, revenue: 4995.00 },
  { date: "2025-01-02", sales: 3, revenue: 2997.00 },
  ...
]

    ↑
[Server Component]
  Aggregate results:
  {
    productCount: 15,
    totalSales: 120,
    totalRevenue: 150000.00,
    uniqueCustomers: 85,
    salesByDate: [...]
  }
    ↓
  Render HTML (Server-Side)
    ↓
  Send to Client
    ↑
[Browser]
  - Display metrics cards
  - Render chart with Recharts (client-side hydration)
```

**Query Optimization:**
- Indexed columns: userId, status, createdAt
- Parallel execution with Promise.all
- Server-side rendering (no loading state)
- Potential caching layer (Redis) for frequently accessed data

---

## External Service Integration Data Flows

### 8.1 Xendit Payment Integration

```
Data Flow: Dotload ↔ Xendit

┌─────────────────────────────────────────────────────────────────┐
│ Outbound: Create Payment                                       │
└─────────────────────────────────────────────────────────────────┘

[Dotload API]
    ↓
  xenditClient.EWallet.createEWalletCharge(payload)
    ↓ HTTPS POST to api.xendit.co/ewallets/charges
    ↓ Headers: Authorization: Basic {base64(SECRET_KEY)}
    ↓ Body:
    {
      "reference_id": "pur123",
      "currency": "PHP",
      "amount": 999,
      "checkout_method": "ONE_TIME_PAYMENT",
      "channel_code": "ID_OVO",
      "channel_properties": {
        "success_redirect_url": "https://dotload.com/success",
        "failure_redirect_url": "https://dotload.com/failure"
      },
      "customer": {
        "email": "buyer@example.com",
        "mobile_number": "+639171234567"
      },
      "metadata": {
        "product_id": "clx456",
        "purchase_id": "pur123"
      }
    }
    ↓
[Xendit API]
    ↑
  Response:
  {
    "id": "ewc_abc123",
    "reference_id": "pur123",
    "status": "PENDING",
    "currency": "PHP",
    "charge_amount": 999,
    "actions": {
      "mobile_web_checkout_url": "https://checkout.xendit.co/web/ewc_abc123"
    },
    "created": "2025-01-15T10:30:00Z"
  }
    ↑
[Dotload API]
  Store payment ID and redirect URL

┌─────────────────────────────────────────────────────────────────┐
│ Inbound: Webhook Notification                                  │
└─────────────────────────────────────────────────────────────────┘

[Xendit]
  POST https://dotload.com/api/payments/webhook
  Headers:
    x-callback-token: "webhook_secret_xyz"
    Content-Type: application/json
  Body:
  {
    "id": "ewc_abc123",
    "external_id": "pur123",
    "status": "SUCCEEDED",
    "amount": 999,
    "payment_method": "EWALLET",
    "ewallet_type": "GCASH",
    "paid_at": "2025-01-15T10:35:00Z",
    "updated": "2025-01-15T10:35:00Z",
    "metadata": {
      "product_id": "clx456",
      "purchase_id": "pur123"
    }
  }
    ↓
[Dotload Webhook Handler]
  1. Verify signature
  2. Update purchase status
  3. Create transaction record
  4. Send emails
  5. Return 200 OK
```

### 8.2 Cloudinary File Storage

```
Data Flow: Dotload ↔ Cloudinary

┌─────────────────────────────────────────────────────────────────┐
│ Upload File                                                     │
└─────────────────────────────────────────────────────────────────┘

[Dotload API]
    ↓
  File buffer: Buffer(2,621,440 bytes)
    ↓
  cloudinary.uploader.upload_stream({
    folder: "dotload/products",
    resource_type: "auto",
    public_id: "product_abc123"
  })
    ↓ HTTPS POST to api.cloudinary.com/v1_1/{cloud_name}/upload
    ↓ Multipart form data
    {
      file: <binary>,
      folder: "dotload/products",
      upload_preset: "dotload_uploads"
    }
    ↓
[Cloudinary API]
  - Processes image
  - Generates variants (thumbnails, optimized formats)
  - Stores on CDN
    ↑
  Response:
  {
    "secure_url": "https://res.cloudinary.com/dotload/image/upload/v1705315200/dotload/products/abc123.jpg",
    "public_id": "dotload/products/abc123",
    "format": "jpg",
    "resource_type": "image",
    "bytes": 2621440,
    "width": 1920,
    "height": 1080,
    "created_at": "2025-01-15T10:00:00Z"
  }
    ↑
[Dotload API]
  Store secure_url in database

┌─────────────────────────────────────────────────────────────────┐
│ Retrieve File (Download)                                       │
└─────────────────────────────────────────────────────────────────┘

[Dotload API]
    ↓
  GET https://res.cloudinary.com/dotload/.../course.pdf
    ↓
[Cloudinary CDN]
  - Serves file from nearest edge location
  - Applies transformations if requested
    ↑
  File stream (50 MB)
    ↑
[Dotload API]
  Stream to client
```

---

## State Management Data Flows

### 9.1 Client-Side State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Authentication State (React Context)                           │
└─────────────────────────────────────────────────────────────────┘

[App Initialization]
    ↓
  Server Component: layout.tsx
    ↓
  Fetch current user:
  async function getCurrentUser() {
    const token = cookies().get('token')
    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await db.findUserById(decoded.userId)
    return user
  }
    ↓
  initialUser = { id: "user123", email: "...", name: "..." }
    ↓
  Render:
  <AuthProviderWrapper initialUser={initialUser}>
    {children}
  </AuthProviderWrapper>
    ↓
[Client Component: AuthProviderWrapper]
    ↓
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(false)
    ↓
  <AuthContext.Provider value={{ user, loading, logout }}>
    {children}
  </AuthContext.Provider>
    ↓
[Child Components]
  const { user, logout } = useAuthState()
    ↓
  Access current user data
  Call logout() when needed

┌─────────────────────────────────────────────────────────────────┐
│ State Update Flow: Logout                                      │
└─────────────────────────────────────────────────────────────────┘

[Component]
  onClick={() => logout()}
    ↓
[AuthContext]
  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setLoading(false)
    router.push('/login')
  }
    ↓
  State changes propagate to all consumers:
  user: {...} → null
  loading: false → true → false
    ↓
  All components using useAuthState() re-render
```

### 9.2 Form State Flow (React Hook Form)

```
┌─────────────────────────────────────────────────────────────────┐
│ Form State Management                                          │
└─────────────────────────────────────────────────────────────────┘

[Component Mount]
    ↓
  const form = useForm({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(loginSchema)
  })
    ↓
  Internal state:
  {
    values: { email: "", password: "" },
    errors: {},
    touched: {},
    isDirty: false,
    isValid: false
  }

[User Types in Field]
    ↓
  onChange event
    ↓
  form.setValue('email', 'user@example.com')
    ↓
  State update:
  {
    values: { email: "user@example.com", password: "" },
    touched: { email: true },
    isDirty: true
  }
    ↓
  Trigger validation (Zod):
    ↓
    loginSchema.parse(values)
    ↓
    If invalid:
      errors: { password: "Password required" }
    ↓
  Re-render with error message

[User Submits Form]
    ↓
  onSubmit(data)
    ↓
  Final validation
    ↓
  If valid → API call
  If invalid → Show errors
```

---

## Summary

This document comprehensively maps all data flows in the Dotload platform:

✅ **User Authentication**: Registration, login, JWT token management
✅ **Product Management**: File uploads to Cloudinary, database storage
✅ **Purchase Flow**: Payment creation, Xendit integration, webhook updates
✅ **File Downloads**: Access validation, streaming from Cloudinary
✅ **Payouts**: Balance calculation, Xendit disbursements
✅ **Email Notifications**: Multi-provider sending (Resend + AWS SES)
✅ **Dashboard Analytics**: Parallel database queries, server-side rendering
✅ **External Services**: Xendit, Cloudinary, email providers
✅ **State Management**: React Context for auth, React Hook Form for forms

Each flow includes:
- Data structures at each step
- Database queries (SQL)
- API requests/responses
- State transformations
- Error handling paths

**Key Patterns:**
1. **Request validation** at multiple layers (client, server, database)
2. **Data transformation** between layers (DTO patterns)
3. **Async operations** via webhooks (payments, payouts)
4. **State synchronization** between client and server
5. **External service integration** with fallback mechanisms
