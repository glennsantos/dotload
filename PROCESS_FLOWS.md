# Dotload - Process Flow Documentation

> **Version:** 1.0.0
> **Created:** 2025-11-19
> **Purpose:** Detailed process flows for all major user journeys and system workflows

---

## Table of Contents

1. [User Authentication Flows](#user-authentication-flows)
2. [Product Management Flows](#product-management-flows)
3. [Purchase and Checkout Flows](#purchase-and-checkout-flows)
4. [Payment Processing Flows](#payment-processing-flows)
5. [File Download Flows](#file-download-flows)
6. [Payout Management Flows](#payout-management-flows)
7. [Email Notification Flows](#email-notification-flows)
8. [Dashboard and Analytics Flows](#dashboard-and-analytics-flows)
9. [Error Handling Flows](#error-handling-flows)
10. [Admin and Moderation Flows](#admin-and-moderation-flows)

---

## User Authentication Flows

### 1.1 User Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates Registration                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User visits /register → Registration Form Displayed
                            ↓
User fills form:
  ├─ Email address
  ├─ Password (minimum 8 characters)
  ├─ Name
  └─ Accept Terms & Conditions
                            ↓
                  [Client-Side Validation]
                            ↓
                    ┌───────┴───────┐
                    │   Valid?      │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Show Validation Errors          POST /api/auth/register
    - Email format invalid          {
    - Password too short              "email": "user@example.com",
    - Missing required fields         "password": "********",
    Return to form                    "name": "John Doe"
                                    }
                                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Server-Side Processing                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              [Validate Request Body]
                            ↓
              Check email format (Zod)
              Check password strength
              Sanitize inputs
                            ↓
                    ┌───────┴───────┐
                    │ Email exists? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            YES                             NO
            ↓                               ↓
    Return 409 Conflict             Hash password (bcryptjs)
    {                               - Salt rounds: 10
      "error": "Email exists"       - Generate hash
    }                                       ↓
                                  Generate verification token
                                  - crypto.randomBytes(32)
                                  - Convert to hex string
                                            ↓
                                  Create User in Database:
                                  {
                                    id: cuid(),
                                    email: "user@example.com",
                                    password: "$2a$10$...", (hashed)
                                    name: "John Doe",
                                    emailVerified: false,
                                    verificationToken: "abc123...",
                                    createdAt: now()
                                  }
                                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Send Verification Email                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Construct verification URL:
              https://domain.com/verify-email?token=abc123...
                            ↓
              Send email via Resend API:
              {
                from: "Dotload <no-reply@dotload.com>",
                to: "user@example.com",
                subject: "Verify your email",
                html: "<verification link>"
              }
                            ↓
                    ┌───────┴───────┐
                    │ Email sent?   │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            FAILED                          SUCCESS
            ↓                               ↓
    Log error                      Return 201 Created
    Continue registration          {
    (user can resend later)          "message": "Registration successful",
                                     "user": {
                                       "id": "clx123",
                                       "email": "user@example.com",
                                       "name": "John Doe"
                                     }
                                   }
                                            ↓
                              Redirect to /verify-email
                              Show "Check your email" message

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Email Verification (Separate Flow)                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User clicks link in email
  → GET /verify-email?token=abc123...
                            ↓
              POST /api/auth/verify-email
              { "token": "abc123..." }
                            ↓
              Find user by verificationToken
                            ↓
                    ┌───────┴───────┐
                    │ User found?   │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 404 Not Found            Update user:
    "Invalid verification token"    - emailVerified = true
    Redirect to /register           - verificationToken = null
                                    - updatedAt = now()
                                            ↓
                                    Return 200 OK
                                    "Email verified successfully"
                                            ↓
                                    Redirect to /login
                                    Show success message

┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATE PATH: Email Not Received                             │
└─────────────────────────────────────────────────────────────────┘
User clicks "Resend verification email"
                ↓
POST /api/auth/resend-verification
{ "email": "user@example.com" }
                ↓
Find user by email
Check emailVerified === false
                ↓
Generate new verification token
Update user.verificationToken
                ↓
Send new verification email
                ↓
Return "Email sent"
```

**Key Decision Points:**
- Email already exists → 409 error
- Email sending fails → Continue anyway (user can resend)
- Invalid verification token → 404 error
- Token expired (future enhancement) → Resend option

**Files Involved:**
- `/app/register/page.tsx` - Registration form UI
- `/app/api/auth/register/route.ts` - Registration endpoint
- `/app/api/auth/verify-email/route.ts` - Verification endpoint
- `/lib/email.ts` - Email sending service
- `/lib/supabase-db.ts` - User database operations

---

### 1.2 User Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates Login                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User visits /login → Login Form Displayed
                            ↓
User enters credentials:
  ├─ Email: user@example.com
  └─ Password: ********
                            ↓
              [Client-Side Validation]
              - Email format check
              - Password not empty
                            ↓
              POST /api/auth/login
              {
                "email": "user@example.com",
                "password": "SecurePass123"
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Authentication                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Find user by email
              SELECT * FROM User WHERE email = ?
                            ↓
                    ┌───────┴───────┐
                    │ User exists?  │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 401 Unauthorized         Compare password hashes
    {                               bcryptjs.compare(
      "error": "Invalid email         inputPassword,
       or password"                   user.password
    }                               )
    ⚠️ Don't reveal which failed            ↓
                                    ┌───────┴───────┐
                                    │ Match?        │
                                    └───────┬───────┘
                                            │
                            ┌───────────────┼───────────────┐
                            NO                              YES
                            ↓                               ↓
                    Return 401                      Check email verified
                    "Invalid email/password"                ↓
                                                    ┌───────┴───────┐
                                                    │ Verified?     │
                                                    └───────┬───────┘
                                                            │
                                            ┌───────────────┼───────────────┐
                                            NO                              YES
                                            ↓                               ↓
                                    Return 403 Forbidden            Generate JWT Token
                                    {                               ────────────────
                                      "error": "Email not verified", Payload:
                                      "requiresVerification": true,  {
                                      "email": "user@example.com"     userId: "clx123",
                                    }                                  email: "user@example.com"
                                    Redirect to /verify-email        }
                                                                     Algorithm: HS256
                                                                     Secret: JWT_SECRET
                                                                     Expiry: 24 hours
                                                                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Session Creation                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Set HTTP-only Cookie:
              ──────────────────────
              Name: "token"
              Value: "eyJhbGciOiJIUzI1NiIs..." (JWT)
              HttpOnly: true
              Secure: true (production only)
              SameSite: "lax"
              Path: "/"
              Max-Age: 86400 (24 hours)
                            ↓
              Return 200 OK
              {
                "message": "Login successful",
                "user": {
                  "id": "clx123",
                  "email": "user@example.com",
                  "name": "John Doe",
                  "storeName": "John's Store"
                }
              }
                            ↓
              Client receives response
              Cookie automatically stored by browser
                            ↓
              Redirect to /dashboard
              or redirect to callbackUrl if present

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Accessing Protected Routes                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User navigates to /dashboard
                            ↓
              [Next.js Middleware Intercepts]
              File: /middleware.ts
                            ↓
              Extract token from cookies
              const token = request.cookies.get('token')
                            ↓
                    ┌───────┴───────┐
                    │ Token exists? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Redirect to /login              Verify JWT signature
    ?callbackUrl=/dashboard         jwtVerify(token, secret)
                                            ↓
                                    ┌───────┴───────┐
                                    │ Valid?        │
                                    └───────┬───────┘
                                            │
                            ┌───────────────┼───────────────┐
                            INVALID                         VALID
                            ↓                               ↓
                    Redirect to /login              Extract payload
                    Clear invalid cookie            { userId, email }
                                                            ↓
                                                    Check email verified
                                                            ↓
                                                    Allow access to route
                                                    Request continues

┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATE PATH: "Remember Me" (Future Enhancement)             │
└─────────────────────────────────────────────────────────────────┘
User checks "Remember Me" checkbox
                ↓
Generate refresh token (longer expiry)
Store in database: RefreshToken table
Set cookie with 30-day expiry
                ↓
When JWT expires:
  - Use refresh token to get new JWT
  - Rotate refresh token for security
```

**Security Measures:**
1. Password never sent in plain text (HTTPS)
2. Generic error messages (don't reveal if email exists)
3. Password hash comparison uses timing-safe algorithm
4. JWT stored in HTTP-only cookie (prevents XSS)
5. SameSite=lax prevents CSRF
6. 24-hour token expiry limits exposure

**Files Involved:**
- `/app/login/page.tsx` - Login form UI
- `/app/api/auth/login/route.ts` - Login endpoint
- `/middleware.ts` - JWT verification and route protection
- `/lib/auth-utils.ts` - JWT utilities

---

### 1.3 Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Requests Password Reset                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User clicks "Forgot Password" on login page
                            ↓
Navigate to /forgot-password
                            ↓
User enters email address
                            ↓
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Generate Reset Token                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Find user by email
              SELECT * FROM User WHERE email = ?
                            ↓
                    ┌───────┴───────┐
                    │ User found?   │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    ⚠️ Security: Still return success  Generate reset token
    Don't reveal if email exists      - crypto.randomBytes(32)
    (prevents email enumeration)      - Convert to hex
                                              ↓
    Return 200 OK                     Calculate expiry
    "If email exists, reset          - expiresAt = now() + 1 hour
     link sent"                               ↓
                                      Delete existing reset tokens
                                      for this user (if any)
                                              ↓
                                      Create PasswordReset record:
                                      {
                                        id: cuid(),
                                        userId: user.id,
                                        token: "abc123...",
                                        expiresAt: Date(+1 hour),
                                        createdAt: now()
                                      }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Send Reset Email                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Construct reset URL:
              https://domain.com/reset-password?token=abc123...
                            ↓
              Send email via Resend:
              {
                from: "Dotload <no-reply@dotload.com>",
                to: "user@example.com",
                subject: "Reset your password",
                html: `
                  <h1>Password Reset Request</h1>
                  <p>Click link to reset password:</p>
                  <a href="${resetUrl}">Reset Password</a>
                  <p>Link expires in 1 hour</p>
                `
              }
                            ↓
              Return 200 OK
              "If email exists, reset link sent"
                            ↓
              User receives email

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: User Resets Password                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User clicks link in email
  → GET /reset-password?token=abc123...
                            ↓
              Load reset password form
              Pre-fill token (hidden field)
                            ↓
User enters new password:
  ├─ New Password: ********
  └─ Confirm Password: ********
                            ↓
              [Client Validation]
              - Passwords match
              - Minimum 8 characters
              - Password strength check
                            ↓
              POST /api/auth/reset-password
              {
                "token": "abc123...",
                "password": "NewSecurePass123"
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Process Password Reset                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Find PasswordReset by token
              SELECT * FROM PasswordReset WHERE token = ?
                            ↓
                    ┌───────┴───────┐
                    │ Token found?  │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 404 Not Found            Check token expiry
    "Invalid or expired token"      if (now() > expiresAt)
    Redirect to /forgot-password            ↓
                                    ┌───────┴───────┐
                                    │ Expired?      │
                                    └───────┬───────┘
                                            │
                            ┌───────────────┼───────────────┐
                            YES                             NO
                            ↓                               ↓
                    Return 410 Gone                 Hash new password
                    "Token expired"                 bcryptjs.hash(password, 10)
                    Delete expired token                    ↓
                    Redirect to /forgot-password    Update user:
                                                    {
                                                      password: newHash,
                                                      updatedAt: now()
                                                    }
                                                            ↓
                                                    Delete PasswordReset record
                                                    (token now consumed)
                                                            ↓
                                                    Return 200 OK
                                                    "Password reset successful"
                                                            ↓
                                                    Redirect to /login
                                                    Show success message

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: User Logs In With New Password                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User enters new credentials on /login
                            ↓
Authentication succeeds with new password
                            ↓
User redirected to /dashboard

┌─────────────────────────────────────────────────────────────────┐
│ SECURITY CONSIDERATIONS                                         │
└─────────────────────────────────────────────────────────────────┘

1. ✅ Token is single-use (deleted after password reset)
2. ✅ Token expires after 1 hour
3. ✅ Generic messages prevent email enumeration
4. ✅ Old tokens invalidated when new one generated
5. ✅ Token stored in database, not in URL parameters only
6. ⚠️ TODO: Add rate limiting to prevent abuse
7. ⚠️ TODO: Log password reset attempts for audit
8. ⚠️ TODO: Send "password changed" notification email
```

**Files Involved:**
- `/app/forgot-password/page.tsx` - Request reset form
- `/app/reset-password/page.tsx` - New password form
- `/app/api/auth/forgot-password/route.ts` - Generate token
- `/app/api/auth/reset-password/route.ts` - Reset password
- `/lib/email.ts` - Send reset email

---

## Product Management Flows

### 2.1 Product Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Seller Initiates Product Creation                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller navigates to /dashboard
                            ↓
Clicks "Create Product" button
                            ↓
Navigate to /create-product
                            ↓
              [Product Creation Form Loads]
              ──────────────────────────────

Form Fields:
┌──────────────────────────────────────┐
│ Basic Information                    │
├──────────────────────────────────────┤
│ ▢ Product Name*                      │
│ ▢ Description (Rich Text Editor)     │
│ ▢ Price* (PHP)                       │
│ ☐ Pay What You Want                  │
│ ▢ Product Type (dropdown)            │
│   - Course                           │
│   - Template                         │
│   - Software                         │
│   - E-book                           │
│   - Other                            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Media                                │
├──────────────────────────────────────┤
│ ▢ Cover Image Upload                 │
│   [Click or drag to upload]          │
│   Accepted: JPG, PNG, WebP           │
│   Max size: 5 MB                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Digital Files                        │
├──────────────────────────────────────┤
│ ▢ Upload Files                       │
│   [Add files]                        │
│   - File 1: course.pdf (2.5 MB)      │
│   - File 2: assets.zip (15 MB)       │
│   [+ Add more files]                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Product Variations (Optional)        │
├──────────────────────────────────────┤
│ ☑ Enable Variations                  │
│                                      │
│ Variation 1:                         │
│   Name: License Type                 │
│   Options: Personal, Commercial      │
│   [+ Add option]                     │
│                                      │
│ [+ Add variation]                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Settings                             │
├──────────────────────────────────────┤
│ ☑ Instant Download                   │
│ ▢ Download Limit: 3                  │
│ ▢ Link Expiration: 7 days            │
│ ☑ Secure Checkout                    │
│ ☐ Allow Pre-orders                   │
│ ☐ Offer Discount Codes               │
└──────────────────────────────────────┘

              [Submit Button]

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Form Submission and Validation                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User clicks "Create Product"
                            ↓
              [Client-Side Validation]
              React Hook Form + Zod Schema
                            ↓
              Validate:
              ✓ Name: min 3 characters
              ✓ Price: > 0
              ✓ Description: optional
              ✓ Cover image: valid format
              ✓ Files: at least 1 uploaded
                            ↓
                    ┌───────┴───────┐
                    │ Valid?        │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Show inline errors:             Upload cover image first
    - Highlight invalid fields              ↓
    - Show error messages           POST /api/upload
    - Focus first error             {
    User fixes errors                 file: coverImage,
    Retry submission                  folder: "dotload/products"
                                    }
                                            ↓
                                    Cloudinary processes upload
                                            ↓
                                    Return:
                                    {
                                      url: "https://res.cloudinary.com/...",
                                      publicId: "dotload/products/abc123"
                                    }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Upload Digital Files                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              For each digital file:
              ──────────────────────
              POST /api/upload
              {
                file: digitalFile,
                folder: "dotload/files"
              }
                            ↓
              Store file URLs temporarily
              [
                "https://res.cloudinary.com/.../file1.pdf",
                "https://res.cloudinary.com/.../file2.zip"
              ]

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Create Product in Database                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              POST /api/products
              {
                "name": "Premium Web Development Course",
                "description": "<p>Learn full-stack development...</p>",
                "price": 999.00,
                "type": "course",
                "coverImagePath": "https://cloudinary.com/...",
                "allowPayWhatYouWant": false,
                "downloadLimit": 3,
                "linkExpiration": 7,
                "instantDownload": true,
                "variations": [
                  {
                    "name": "License Type",
                    "options": ["Personal", "Commercial"]
                  }
                ],
                "fileUrls": [
                  "https://cloudinary.com/.../course.pdf",
                  "https://cloudinary.com/.../assets.zip"
                ]
              }
                            ↓
              [Server-Side Processing]
              ─────────────────────────
                            ↓
              1. Validate authentication
                 - Check JWT token
                 - Extract userId
                            ↓
              2. Validate product data
                 - Zod schema validation
                 - Check price > 0
                 - Sanitize HTML description
                            ↓
              3. Generate unique slug
                 - From product name
                 - "premium-web-development-course"
                 - Check uniqueness
                 - Add suffix if duplicate: "-2", "-3"
                            ↓
              4. Create Product record
                 INSERT INTO Product {
                   id: cuid(),
                   userId: "seller_id",
                   name: "Premium Web Development Course",
                   slug: "premium-web-development-course",
                   price: 999.00,
                   description: "<p>...</p>",
                   coverImagePath: "...",
                   type: "course",
                   currency: "PHP",
                   isPublic: true,
                   status: "active",
                   allowPayWhatYouWant: false,
                   downloadLimit: 3,
                   linkExpiration: 7,
                   instantDownload: true,
                   createdAt: now(),
                   updatedAt: now()
                 }
                            ↓
              5. Create File records
                 For each uploaded file:
                 INSERT INTO File {
                   id: cuid(),
                   productId: product.id,
                   filename: "course.pdf",
                   path: "https://cloudinary.com/...",
                   mimetype: "application/pdf",
                   size: 2621440, (bytes)
                   createdAt: now()
                 }
                            ↓
              6. Create Variation records (if any)
                 INSERT INTO Variation {
                   id: cuid(),
                   productId: product.id,
                   name: "License Type",
                   options: JSON(["Personal", "Commercial"]),
                   createdAt: now()
                 }
                            ↓
              7. Return product data
                 {
                   "message": "Product created successfully",
                   "product": {
                     "id": "clx456abc",
                     "slug": "premium-web-development-course",
                     "name": "Premium Web Development Course",
                     "price": 999.00,
                     "coverImagePath": "...",
                     "createdAt": "2025-01-15T10:00:00Z"
                   }
                 }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Post-Creation Actions                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Client receives success response
                            ↓
              Show success toast notification
              "Product created successfully!"
                            ↓
              Redirect to product page
              /products/{productId}
              or
              /p/{slug} (public view)
                            ↓
              Seller can:
              ├─ Preview product
              ├─ Edit product
              ├─ Share link
              ├─ View analytics
              └─ Create more products

┌─────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING                                                  │
└─────────────────────────────────────────────────────────────────┘

Possible Errors:
┌────────────────────────────────────────────────────────────┐
│ Error                    │ Status │ Action                 │
├────────────────────────────────────────────────────────────┤
│ Unauthorized             │ 401    │ Redirect to /login     │
│ File upload failed       │ 500    │ Retry upload           │
│ Duplicate slug           │ 409    │ Auto-generate new slug │
│ Invalid price            │ 400    │ Show validation error  │
│ File too large           │ 413    │ Show size error        │
│ Database error           │ 500    │ Show generic error     │
│ Network timeout          │ 504    │ Retry request          │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Rich text editor for descriptions
- ✅ Multiple file uploads with progress
- ✅ Product variations support
- ✅ Automatic slug generation
- ✅ Cloudinary integration for media
- ✅ Validation at multiple levels
- ✅ Error recovery mechanisms

**Files Involved:**
- `/app/create-product/page.tsx` - Product creation form
- `/app/api/products/route.ts` - POST handler
- `/app/api/upload/route.ts` - File upload endpoint
- `/components/rich-text-editor.tsx` - Description editor
- `/lib/form-validation.ts` - Zod schemas
- `/lib/supabase-db.ts` - Database operations

---

### 2.2 Product Edit Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Load Existing Product Data                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller navigates to /edit-product/{productId}
                            ↓
              GET /api/products/{productId}
                            ↓
              Verify ownership:
              - Check product.userId === currentUser.id
                            ↓
                    ┌───────┴───────┐
                    │ Owner?        │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 403 Forbidden            Fetch product with relations:
    "Not authorized"                - Product
                                    - Files
                                    - Variations
                                            ↓
                                    Return product data:
                                    {
                                      "product": {
                                        "id": "clx456",
                                        "name": "Premium Course",
                                        "price": 999.00,
                                        "description": "<p>...</p>",
                                        "coverImagePath": "...",
                                        "files": [
                                          { "id": "file1", "filename": "course.pdf" }
                                        ],
                                        "variations": [
                                          { "id": "var1", "name": "License", "options": [...] }
                                        ]
                                      }
                                    }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Pre-fill Form with Existing Data                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              React Hook Form initializes:
              {
                defaultValues: {
                  name: product.name,
                  price: product.price,
                  description: product.description,
                  ...
                }
              }
                            ↓
              Form displays with current values
              User can modify any field

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: User Makes Changes                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller modifies fields:
  ├─ Update price: 999 → 1299
  ├─ Add new variation option
  ├─ Upload additional file
  └─ Update description
                            ↓
              Click "Update Product"
                            ↓
              [Track Changes]
              Only modified fields sent to server:
              {
                "price": 1299.00,
                "variations": [...updated array],
                "newFiles": [uploadedFile]
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Process Update                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              PUT /api/products/{productId}
              {
                "price": 1299.00,
                "variations": [...]
              }
                            ↓
              [Server Processing]
              1. Verify ownership again
              2. Validate changes
              3. Update Product record
              4. Handle file changes:
                 - Upload new files
                 - Delete removed files
              5. Update Variations:
                 - Delete removed variations
                 - Create new variations
                 - Update existing
                            ↓
              UPDATE Product
              SET
                price = 1299.00,
                updatedAt = now()
              WHERE id = productId
                            ↓
              Return updated product
                            ↓
              Show success message
              Redirect to product view
```

**Files Involved:**
- `/app/edit-product/[id]/page.tsx` - Edit form
- `/app/api/products/[id]/route.ts` - PUT handler

---

## Purchase and Checkout Flows

### 3.1 Complete Purchase Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Discovers Product                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer visits public product page
GET /p/{slug}
                            ↓
              Server-side rendering:
              - Fetch product by slug
              - Include seller info
              - Include variations
              - Include sample files (if any)
                            ↓
              Render product page:
              ┌──────────────────────────────────────┐
              │ Premium Web Development Course       │
              ├──────────────────────────────────────┤
              │ [Cover Image]                        │
              │                                      │
              │ ₱999.00                              │
              │ By John's Store                      │
              │                                      │
              │ [Product Description]                │
              │ Learn full-stack development...      │
              │                                      │
              │ Includes:                            │
              │ • 20 hours of video                  │
              │ • Source code                        │
              │ • Certificate                        │
              │                                      │
              │ [Buy Now] [Add to Wishlist]          │
              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Initiate Checkout                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer clicks "Buy Now"
                            ↓
Navigate to /p/{slug}/checkout
                            ↓
              Load checkout form:
              ┌──────────────────────────────────────┐
              │ Checkout                             │
              ├──────────────────────────────────────┤
              │ Product: Premium Course              │
              │ Price: ₱999.00                       │
              │                                      │
              │ Contact Information                  │
              │ ▢ Email*                             │
              │ ▢ Mobile Number*                     │
              │                                      │
              │ Select Variation (if applicable)     │
              │ ○ Personal License                   │
              │ ● Commercial License (+₱500)         │
              │                                      │
              │ Payment Method                       │
              │ ○ Credit/Debit Card                  │
              │ ● E-Wallet (GCash, Maya)             │
              │ ○ Bank Transfer                      │
              │ ○ QR Code                            │
              │                                      │
              │ Discount Code (optional)             │
              │ ▢ Enter code  [Apply]                │
              │                                      │
              │ Total: ₱1,499.00                     │
              │                                      │
              │ [Proceed to Payment]                 │
              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Validate and Create Purchase                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer fills form and clicks "Proceed to Payment"
                            ↓
              [Client Validation]
              - Email format
              - Mobile number format (PH)
              - Payment method selected
                            ↓
              POST /api/payments/create
              {
                "productId": "clx456",
                "email": "buyer@example.com",
                "mobileNumber": "+639171234567",
                "paymentMethod": "eWallet",
                "amount": 1499.00,
                "variation": "Commercial License",
                "discountCode": "SAVE20" (if applied)
              }
                            ↓
              [Server Processing]
              ─────────────────────
                            ↓
              1. Validate product exists
                 SELECT * FROM Product WHERE id = ?
                            ↓
                    ┌───────┴───────┐
                    │ Exists & Active? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 404 Not Found            2. Validate discount code (if provided)
    "Product not found"                     ↓
                                    SELECT * FROM DiscountCode
                                    WHERE code = 'SAVE20'
                                      AND productId = ?
                                      AND isActive = true
                                      AND expiresAt > now()
                                            ↓
                                    Calculate discounted price:
                                    basePrice = 1499.00
                                    discount = 20%
                                    finalPrice = 1499 - (1499 * 0.20)
                                               = 1199.20
                                            ↓
                                    3. Generate unique access code
                                       accessCode = generateCode()
                                       // e.g., "ABC123XYZ456"
                                       // Must be unique in Purchase table
                                            ↓
                                    4. Create Purchase record
                                       INSERT INTO Purchase {
                                         id: cuid(),
                                         productId: "clx456",
                                         email: "buyer@example.com",
                                         mobileNumber: "+639171234567",
                                         amount: 1199.20,
                                         paymentMethod: "eWallet",
                                         status: "pending",
                                         accessCode: "ABC123XYZ456",
                                         userId: null, (guest purchase)
                                         createdAt: now(),
                                         updatedAt: now()
                                       }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Process Payment via Xendit                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Based on paymentMethod:
              ══════════════════════════

              If E-Wallet:
              ────────────
              Call Xendit API:
              xenditClient.EWallet.createEWalletCharge({
                referenceId: purchase.id,
                currency: "PHP",
                amount: 1199.20,
                checkoutMethod: "ONE_TIME_PAYMENT",
                channelCode: "ID_OVO", // or PH_GCASH, PH_PAYMAYA
                channelProperties: {
                  successRedirectUrl: `${DOMAIN}/p/${slug}/success?code=${accessCode}`,
                  failureRedirectUrl: `${DOMAIN}/p/${slug}/failure`
                },
                customer: {
                  email: "buyer@example.com",
                  mobileNumber: "+639171234567"
                },
                metadata: {
                  productId: "clx456",
                  purchaseId: purchase.id
                }
              })
                            ↓
              Xendit returns:
              {
                id: "ewc_abc123", (payment ID)
                status: "PENDING",
                actions: {
                  mobile_web_checkout_url: "https://checkout.xendit.co/web/ewc_abc123"
                }
              }
                            ↓
              5. Store payment ID
                 UPDATE Purchase
                 SET paymentId = "ewc_abc123"
                 WHERE id = purchase.id
                            ↓
              6. Return redirect URL to client
                 {
                   "purchase": {
                     "id": purchase.id,
                     "accessCode": "ABC123XYZ456",
                     "status": "pending"
                   },
                   "redirectUrl": "https://checkout.xendit.co/web/ewc_abc123",
                   "paymentId": "ewc_abc123"
                 }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Customer Completes Payment on Xendit                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Client receives response and redirects:
window.location.href = response.redirectUrl
                            ↓
              Customer redirected to Xendit:
              ┌──────────────────────────────────────┐
              │ Xendit Checkout                      │
              ├──────────────────────────────────────┤
              │ Pay ₱1,199.20                        │
              │                                      │
              │ Select E-Wallet:                     │
              │ [GCash] [Maya] [GrabPay]             │
              │                                      │
              │ Customer selects GCash               │
              │                                      │
              │ [Redirects to GCash app/website]     │
              │                                      │
              │ Customer authenticates in GCash      │
              │ • Enter mobile number                │
              │ • Enter MPIN                         │
              │ • Confirm payment                    │
              │                                      │
              │ [Payment Processing...]              │
              └──────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │ Payment Success? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            FAILED                          SUCCESS
            ↓                               ↓
    Redirect to failure URL         Redirect to success URL
    /p/{slug}/failure              /p/{slug}/success?code=ABC123XYZ456

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Xendit Webhook Notification (Async)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Xendit sends webhook:
              POST /api/payments/webhook
              Headers: {
                x-callback-token: "webhook_secret"
              }
              Body: {
                id: "ewc_abc123",
                external_id: purchase.id,
                status: "SUCCEEDED",
                amount: 1199.20,
                payment_method: "EWALLET",
                ewallet_type: "GCASH",
                paid_at: "2025-01-15T10:35:00Z",
                metadata: {
                  productId: "clx456",
                  purchaseId: purchase.id
                }
              }
                            ↓
              [Webhook Handler]
              ─────────────────
                            ↓
              1. Verify webhook signature
                 const signature = request.headers['x-callback-token']
                 if (signature !== XENDIT_WEBHOOK_SECRET)
                   return 401 Unauthorized
                            ↓
              2. Find purchase
                 SELECT * FROM Purchase WHERE id = external_id
                            ↓
              3. Update purchase status
                 UPDATE Purchase
                 SET
                   status = "completed",
                   updatedAt = now()
                 WHERE id = purchase.id
                            ↓
              4. Create transaction record
                 INSERT INTO Transaction {
                   id: uuid(),
                   userId: product.userId,
                   amount: 1199.20,
                   type: "sale",
                   status: "completed",
                   reference: "ewc_abc123",
                   description: "Sale of Premium Course",
                   metadata: JSON({
                     purchaseId: purchase.id,
                     paymentMethod: "GCASH",
                     paidAt: "2025-01-15T10:35:00Z"
                   }),
                   createdAt: now()
                 }
                            ↓
              5. Send confirmation emails
                 ┌─────────────────────────┐
                 │ To Buyer:               │
                 │ - Purchase confirmation │
                 │ - Download link         │
                 │ - Access code           │
                 └─────────────────────────┘
                 ┌─────────────────────────┐
                 │ To Seller:              │
                 │ - New sale notification │
                 │ - Buyer email           │
                 │ - Amount                │
                 └─────────────────────────┘
                            ↓
              6. Return 200 OK to Xendit
                 (acknowledges webhook received)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Customer Views Success Page                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer redirected to:
/p/{slug}/success?code=ABC123XYZ456
                            ↓
              Server fetches purchase:
              SELECT * FROM Purchase WHERE accessCode = ?
                            ↓
              Render success page:
              ┌──────────────────────────────────────┐
              │ ✓ Purchase Successful!               │
              ├──────────────────────────────────────┤
              │ Thank you for your purchase!         │
              │                                      │
              │ Order Details:                       │
              │ • Product: Premium Course            │
              │ • Amount: ₱1,199.20                  │
              │ • Date: Jan 15, 2025                 │
              │                                      │
              │ Access Code: ABC123XYZ456            │
              │ Save this code for future downloads  │
              │                                      │
              │ [Download Files Now]                 │
              │                                      │
              │ Email sent to: buyer@example.com     │
              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Customer Downloads Files                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer clicks "Download Files Now"
                            ↓
GET /api/downloads/secure?accessCode=ABC123XYZ456
                            ↓
              [See File Download Flow - Section 5.1]

┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATE PATHS                                                 │
└─────────────────────────────────────────────────────────────────┘

Path A: Payment Fails
──────────────────────
Customer payment fails on Xendit
    ↓
Redirect to /p/{slug}/failure
    ↓
Show failure page with:
- Error message
- Retry button
- Contact support option
    ↓
Purchase status remains "pending"
Customer can retry payment

Path B: Payment Timeout
───────────────────────
Customer abandons payment
    ↓
Purchase status: "pending"
    ↓
After 24 hours:
- Update status to "expired"
- Send abandonment email (optional)

Path C: Logged-In User
──────────────────────
If customer is logged in:
    ↓
Pre-fill email from user profile
    ↓
Link purchase to user account:
UPDATE Purchase SET userId = currentUser.id
    ↓
Show in buyer dashboard

Path D: Discount Code Invalid
─────────────────────────────
Customer enters invalid code
    ↓
Return error:
- "Invalid discount code"
- "Code expired"
- "Code already used"
    ↓
Show original price
Customer can proceed without discount
```

**Key Features:**
- ✅ Guest checkout (no login required)
- ✅ Multiple payment methods
- ✅ Discount code support
- ✅ Product variations
- ✅ Secure payment processing
- ✅ Webhook-based status updates
- ✅ Email confirmations
- ✅ Access code for downloads

**Files Involved:**
- `/app/p/[slug]/page.tsx` - Product page
- `/app/p/[slug]/checkout/page.tsx` - Checkout form
- `/app/p/[slug]/success/page.tsx` - Success page
- `/app/p/[slug]/failure/page.tsx` - Failure page
- `/app/api/payments/create/route.ts` - Create payment
- `/app/api/payments/webhook/route.ts` - Webhook handler
- `/lib/xendit-client.ts` - Payment gateway
- `/lib/email.ts` - Email notifications

---

## Payment Processing Flows

### 4.1 E-Wallet Payment Flow (GCash, Maya, etc.)

```
[Detailed flow for E-Wallet payments - covered in 3.1]

Key Points:
- Creates EWalletCharge via Xendit
- Redirects to Xendit checkout page
- Customer completes payment in e-wallet app
- Webhook confirms payment
- Customer redirected back to success page
```

### 4.2 Credit Card Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Card Payment Flow                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer selects "Credit/Debit Card" at checkout
                            ↓
              POST /api/payments/xendit/card
              {
                "purchaseId": "purchase_id",
                "cardDetails": {
                  "cardNumber": "4000000000000002",
                  "expiryMonth": "12",
                  "expiryYear": "2025",
                  "cvv": "123",
                  "cardHolderName": "John Doe"
                }
              }
                            ↓
              Xendit processes card:
              1. Tokenize card details
              2. Authenticate (3D Secure)
              3. Authorize payment
              4. Capture funds
                            ↓
                    ┌───────┴───────┐
                    │ 3DS Required? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            YES                             NO
            ↓                               ↓
    Return authentication URL       Charge card immediately
    Customer redirects to bank      Return success/failure
    Complete 3DS challenge                  ↓
    Return to merchant              Webhook updates status
            ↓
    Charge card after auth
            ↓
    Webhook updates status
```

**Files Involved:**
- `/app/api/payments/xendit/card/route.ts`
- `/components/payment/CreditCardForm.tsx`

### 4.3 Bank Transfer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Bank Transfer Flow                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer selects "Bank Transfer"
                            ↓
              Create Virtual Account:
              xenditClient.VirtualAccount.create({
                externalId: purchase.id,
                bankCode: "BPI", // or BDO, UBP, etc.
                name: "buyer@example.com",
                expectedAmount: 1199.20,
                expirationDate: now() + 24 hours
              })
                            ↓
              Return virtual account details:
              {
                accountNumber: "1234567890",
                bankCode: "BPI",
                bankName: "Bank of the Philippine Islands",
                accountName: "Dotload Payments",
                amount: 1199.20,
                expiresAt: "2025-01-16T10:00:00Z"
              }
                            ↓
              Display payment instructions:
              ┌──────────────────────────────────────┐
              │ Bank Transfer Details                │
              ├──────────────────────────────────────┤
              │ Bank: BPI                            │
              │ Account Number: 1234567890           │
              │ Account Name: Dotload Payments       │
              │ Amount: ₱1,199.20                    │
              │                                      │
              │ Important:                           │
              │ - Transfer exact amount              │
              │ - Payment expires in 24 hours        │
              │ - Use online banking or OTC          │
              │                                      │
              │ [I've Made the Payment]              │
              └──────────────────────────────────────┘
                            ↓
Customer transfers funds via:
- Online banking
- Mobile app
- Over-the-counter
                            ↓
Bank processes payment (1-5 minutes)
                            ↓
Xendit receives payment notification
                            ↓
Webhook sent to /api/payments/webhook
                            ↓
Purchase status → "completed"
                            ↓
Customer receives confirmation email
```

**Files Involved:**
- `/app/api/payments/xendit/bank-transfer/route.ts`

### 4.4 QR Code Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ QR Code Payment Flow                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer selects "QR Code"
                            ↓
              Generate QR code:
              xenditClient.QrCode.create({
                externalId: purchase.id,
                type: "DYNAMIC",
                amount: 1199.20,
                callbackUrl: `${DOMAIN}/api/payments/webhook`
              })
                            ↓
              Display QR code:
              ┌──────────────────────────────────────┐
              │ Scan QR Code to Pay                  │
              ├──────────────────────────────────────┤
              │                                      │
              │      ████████████████████            │
              │      ████ QR CODE ████               │
              │      ████████████████████            │
              │                                      │
              │ Amount: ₱1,199.20                    │
              │                                      │
              │ Scan with your mobile banking app    │
              │ or e-wallet                          │
              │                                      │
              │ [Waiting for payment...]             │
              └──────────────────────────────────────┘
                            ↓
Customer scans QR with phone
                            ↓
Payment app opens with pre-filled amount
                            ↓
Customer confirms payment
                            ↓
Webhook received → Status updated
```

**Files Involved:**
- `/app/api/payments/xendit/qr-code/route.ts`

---

## File Download Flows

### 5.1 Secure File Download Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Initiates Download                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Customer has multiple entry points:
1. Success page after purchase
2. Email confirmation link
3. Buyer dashboard
4. Direct URL with access code
                            ↓
All routes lead to:
GET /api/downloads/secure?accessCode=ABC123XYZ456
                  OR
GET /p/{slug}/content (redirects to secure download)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Validate Access Code                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              [Server-Side Validation]
              ─────────────────────────
                            ↓
              1. Check access code provided
                            ↓
                    ┌───────┴───────┐
                    │ Code exists?  │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 400 Bad Request          Find purchase by access code
    "Access code required"          SELECT * FROM Purchase
                                    WHERE accessCode = ?
                                            ↓
                                    ┌───────┴───────┐
                                    │ Found?        │
                                    └───────┬───────┘
                                            │
                            ┌───────────────┼───────────────┐
                            NO                              YES
                            ↓                               ↓
                    Return 404 Not Found            Load related data:
                    "Invalid access code"           - Product
                    Possible reasons:               - Files
                    - Typo in code                  - Product settings
                    - Fake/guessed code             - Previous downloads
                    - Code from different system

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Verify Purchase Status                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Check purchase.status
                            ↓
                    ┌───────┴───────┐
                    │ Status?       │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        pending            completed            failed/refunded
        ↓                  ↓                    ↓
Return 402              Continue              Return 403
Payment Required        ↓                     "Purchase invalid"
"Payment not                                  Contact support
confirmed yet"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Check Download Limits                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              If product.downloadLimit is set:
              ────────────────────────────────
                            ↓
              Count previous downloads:
              SELECT COUNT(*) FROM FileDownload
              WHERE purchaseId = purchase.id
                            ↓
              downloadCount = 2
              downloadLimit = 3
                            ↓
                    ┌───────┴───────┐
                    │ Limit exceeded? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            YES (count >= limit)            NO (count < limit)
            ↓                               ↓
    Return 403 Forbidden            Continue to next check
    {                               ↓
      "error": "Download limit
       exceeded",
      "downloadsUsed": 3,
      "downloadLimit": 3,
      "message": "You have used
       all 3 downloads. Contact
       seller for more access."
    }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Check Link Expiration                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              If product.linkExpiration is set:
              ────────────────────────────────
                            ↓
              Calculate expiry date:
              purchaseDate = purchase.createdAt
              linkExpiration = product.linkExpiration (days)
              expiryDate = purchaseDate + linkExpiration
                            ↓
              Example:
              purchaseDate = 2025-01-15
              linkExpiration = 7 days
              expiryDate = 2025-01-22
              currentDate = 2025-01-20
                            ↓
                    ┌───────┴───────┐
                    │ Expired?      │
                    │ now > expiry? │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            YES                             NO
            ↓                               ↓
    Return 410 Gone                 Continue to download
    {                               ↓
      "error": "Download link
       expired",
      "expiredOn": "2025-01-22",
      "message": "Link expired
       on Jan 22. Contact seller."
    }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Fetch Files from Storage                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Get product files:
              SELECT * FROM File
              WHERE productId = product.id
              ORDER BY createdAt ASC
                            ↓
              Files returned:
              [
                {
                  id: "file1",
                  filename: "course-videos.zip",
                  path: "https://res.cloudinary.com/.../course.zip",
                  mimetype: "application/zip",
                  size: 52428800 (50 MB)
                },
                {
                  id: "file2",
                  filename: "source-code.zip",
                  path: "https://res.cloudinary.com/.../code.zip",
                  mimetype: "application/zip",
                  size: 2097152 (2 MB)
                }
              ]

┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Log Download Activity                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              For each file being downloaded:
              ────────────────────────────────
                            ↓
              Create FileDownload record:
              INSERT INTO FileDownload {
                id: cuid(),
                fileId: file.id,
                purchaseId: purchase.id,
                userId: purchase.userId, (if logged in)
                downloadedAt: now(),
                userAgent: request.headers['user-agent'],
                ipAddress: request.headers['x-forwarded-for'] || request.ip,
                metadata: JSON({
                  browser: "Chrome 120",
                  os: "Windows 10",
                  device: "Desktop",
                  referrer: request.headers['referer']
                })
              }
                            ↓
              This log is used for:
              ✓ Counting downloads (for limit)
              ✓ Analytics (popular products)
              ✓ Security (detect abuse)
              ✓ Audit trail

┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Stream File to Customer                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Fetch file from Cloudinary:
              const fileResponse = await fetch(file.path)
                            ↓
              Convert to blob:
              const fileBlob = await fileResponse.blob()
                            ↓
              Stream to client with headers:
              return new NextResponse(fileBlob, {
                headers: {
                  'Content-Type': file.mimetype || 'application/octet-stream',
                  'Content-Disposition': `attachment; filename="${file.filename}"`,
                  'Content-Length': file.size.toString(),
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              })
                            ↓
              Browser receives file:
              - Download dialog appears
              - File saves to Downloads folder
              - Download complete

┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Post-Download Actions                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Update download count (in-memory or cache)
                            ↓
              If all files downloaded:
              - Send "download complete" email (optional)
              - Update analytics
                            ↓
              Customer can:
              - Download again (if within limit)
              - Access files from buyer dashboard
              - Use access code on any device

┌─────────────────────────────────────────────────────────────────┐
│ SECURITY MEASURES                                               │
└─────────────────────────────────────────────────────────────────┘

1. ✅ Access code verification (unique, random)
2. ✅ Purchase status validation
3. ✅ Download limit enforcement
4. ✅ Link expiration checking
5. ✅ IP and user agent logging (detect abuse)
6. ✅ No direct file URLs exposed
7. ✅ Files streamed through API (not public URLs)
8. ✅ Cache control headers prevent caching
9. ⚠️ TODO: Rate limiting per IP
10. ⚠️ TODO: Detect and block download bots
11. ⚠️ TODO: Watermark files with buyer info

┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATE PATHS                                                 │
└─────────────────────────────────────────────────────────────────┘

Path A: Multiple Files
──────────────────────
If product has multiple files:
    ↓
Show file list page:
- course-videos.zip (50 MB)
- source-code.zip (2 MB)
- certificates.pdf (500 KB)
    ↓
Customer clicks individual files
Each triggers separate download flow

Path B: ZIP All Files
─────────────────────
If "Download All" clicked:
    ↓
Server creates temporary ZIP:
1. Fetch all files
2. Create ZIP archive
3. Stream ZIP to customer
4. Delete temp ZIP after download

Path C: Streaming Large Files
─────────────────────────────
For very large files (>100 MB):
    ↓
Use range requests:
- Support partial downloads
- Allow resume on failure
- Stream in chunks

Path D: Download from Email
───────────────────────────
Customer clicks link in email:
    ↓
Link format: /download/{token}
    ↓
Server decodes token → access code
    ↓
Same validation flow
```

**Files Involved:**
- `/app/api/downloads/secure/route.ts` - Main download handler
- `/app/api/downloads/secure/[token]/route.ts` - Token-based download
- `/app/p/[slug]/content/page.tsx` - File access page
- `/lib/file-utils.ts` - File utilities

---

## Payout Management Flows

### 6.1 Payout Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Seller Views Available Balance                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller navigates to /payout or /dashboard/payouts
                            ↓
              Calculate available balance:
              ────────────────────────────
                            ↓
              1. Get all completed sales:
                 SELECT SUM(amount) FROM Purchase
                 WHERE product.userId = currentUser.id
                   AND status = 'completed'
                            ↓
                 totalRevenue = ₱50,000.00
                            ↓
              2. Get all previous payouts:
                 SELECT SUM(amount) FROM Payout
                 WHERE userId = currentUser.id
                   AND status IN ('COMPLETED', 'PENDING')
                            ↓
                 totalPayouts = ₱30,000.00
                            ↓
              3. Calculate available balance:
                 availableBalance = totalRevenue - totalPayouts
                                  = 50,000 - 30,000
                                  = ₱20,000.00
                            ↓
              Display dashboard:
              ┌──────────────────────────────────────┐
              │ Payout Management                    │
              ├──────────────────────────────────────┤
              │ Available Balance: ₱20,000.00        │
              │ Total Revenue: ₱50,000.00            │
              │ Total Payouts: ₱30,000.00            │
              │                                      │
              │ Payout History:                      │
              │ ┌────────────────────────────────┐   │
              │ │ Jan 1  │ COMPLETED │ ₱10,000  │   │
              │ │ Jan 8  │ COMPLETED │ ₱20,000  │   │
              │ │ Jan 14 │ PENDING   │ ₱5,000   │   │
              │ └────────────────────────────────┘   │
              │                                      │
              │ [Request Payout]                     │
              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Seller Initiates Payout Request                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller clicks "Request Payout"
                            ↓
              Load payout form:
              ┌──────────────────────────────────────┐
              │ Request Payout                       │
              ├──────────────────────────────────────┤
              │ Available Balance: ₱20,000.00        │
              │                                      │
              │ Amount to Request                    │
              │ ▢ ₱ [15000]                          │
              │   Minimum: ₱100                      │
              │   Maximum: ₱20,000                   │
              │                                      │
              │ Bank Details                         │
              │ ▢ Bank                               │
              │   [BDO ▾]                            │
              │                                      │
              │ ▢ Account Number                     │
              │   [1234567890]                       │
              │                                      │
              │ ▢ Account Holder Name                │
              │   [Juan Dela Cruz]                   │
              │                                      │
              │ Fees & Charges:                      │
              │ • Platform fee (5%): ₱750.00         │
              │ • Processing fee: ₱15.00             │
              │                                      │
              │ You will receive: ₱14,235.00         │
              │                                      │
              │ [Request Payout]                     │
              └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Submit Payout Request                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller fills form and clicks "Request Payout"
                            ↓
              [Client Validation]
              - Amount > minimum (₱100)
              - Amount <= available balance
              - Bank selected
              - Account number valid format
              - Account holder name provided
                            ↓
              POST /api/payouts
              {
                "amount": 15000.00,
                "bankCode": "BDO",
                "accountNumber": "1234567890",
                "accountHolderName": "Juan Dela Cruz"
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Server-Side Validation                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              [Validate Request]
              ────────────────────
                            ↓
              1. Verify authentication
                 - Check JWT token
                 - Extract userId
                            ↓
              2. Calculate available balance (again)
                 - Prevent race conditions
                 - Ensure balance hasn't changed
                            ↓
                    ┌───────┴───────┐
                    │ Sufficient    │
                    │ balance?      │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            NO                              YES
            ↓                               ↓
    Return 400 Bad Request          3. Calculate fees
    {                               ───────────────────
      "error": "Insufficient
       balance",                    percentageFee = amount × 0.05
      "available": 20000,                         = 15000 × 0.05
      "requested": 25000                          = ₱750.00
    }
                                    fixedFee = ₱15.00

                                    netAmount = amount - percentageFee - fixedFee
                                              = 15000 - 750 - 15
                                              = ₱14,235.00
                                            ↓
                                    4. Validate minimum payout
                                       if (amount < 100)
                                         return 400 "Minimum ₱100"
                                            ↓
                                    5. Validate bank details
                                       - Bank code valid
                                       - Account number format
                                       - Account holder name

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Create Payout Record                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              INSERT INTO Payout {
                id: uuid(),
                userId: currentUser.id,
                amount: 15000.00,
                status: "PENDING",
                bankCode: "BDO",
                accountNumber: "1234567890",
                accountHolderName: "Juan Dela Cruz",
                externalId: null, (set after Xendit call)
                disbursementId: null,
                createdAt: now(),
                updatedAt: now()
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Process Payout via Xendit                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Call Xendit Disbursement API:
              ──────────────────────────────
                            ↓
              xenditClient.Disbursement.create({
                externalId: payout.id,
                amount: 14235.00, (net amount after fees)
                bankCode: "BDO",
                accountHolderName: "Juan Dela Cruz",
                accountNumber: "1234567890",
                description: "Dotload seller payout",
                emailTo: [user.email],
                emailCC: [],
                emailBCC: []
              })
                            ↓
              Xendit validates and queues:
              {
                id: "disb_abc123",
                externalId: payout.id,
                amount: 14235,
                bankCode: "BDO",
                accountHolderName: "Juan Dela Cruz",
                status: "PENDING",
                createdAt: "2025-01-15T10:00:00Z"
              }
                            ↓
              Update payout record:
              UPDATE Payout
              SET
                externalId = "payout_abc123",
                disbursementId = "disb_abc123",
                updatedAt = now()
              WHERE id = payout.id
                            ↓
              Return success to client:
              {
                "message": "Payout requested successfully",
                "payout": {
                  "id": payout.id,
                  "amount": 15000.00,
                  "netAmount": 14235.00,
                  "status": "PENDING",
                  "bankCode": "BDO",
                  "accountNumber": "****7890",
                  "createdAt": "2025-01-15T10:00:00Z",
                  "estimatedArrival": "1-3 business days"
                }
              }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Xendit Processes Payout (Async)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              Xendit sends funds to bank:
              ────────────────────────────
                            ↓
              Processing time: 1-3 business days
                            ↓
              Xendit sends webhook updates:

              Webhook 1: PROCESSING
              POST /api/payouts/webhook
              {
                id: "disb_abc123",
                external_id: payout.id,
                status: "PROCESSING",
                updated: "2025-01-15T12:00:00Z"
              }
              → Update payout status to "PROCESSING"

              Webhook 2: COMPLETED
              POST /api/payouts/webhook
              {
                id: "disb_abc123",
                external_id: payout.id,
                status: "COMPLETED",
                updated: "2025-01-17T09:30:00Z",
                disbursement_description: "Successfully disbursed to BDO"
              }
              → Update payout status to "COMPLETED"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Seller Notification                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              When status changes to COMPLETED:
              ──────────────────────────────────
                            ↓
              Send email notification:
              {
                from: "Dotload <no-reply@dotload.com>",
                to: user.email,
                subject: "Payout Completed - ₱14,235.00",
                html: `
                  <h1>Payout Completed</h1>
                  <p>Your payout has been successfully processed!</p>

                  <h2>Details:</h2>
                  <ul>
                    <li>Amount: ₱14,235.00</li>
                    <li>Bank: BDO</li>
                    <li>Account: ****7890</li>
                    <li>Date: Jan 17, 2025</li>
                  </ul>

                  <p>Funds should appear in your account within 24 hours.</p>
                `
              }
                            ↓
              Update payout dashboard:
              - Status badge: "COMPLETED" (green)
              - Update available balance
              - Add to payout history

┌─────────────────────────────────────────────────────────────────┐
│ ERROR SCENARIOS                                                 │
└─────────────────────────────────────────────────────────────────┘

Scenario A: Invalid Bank Account
─────────────────────────────────
Xendit validation fails:
    ↓
Webhook: status = "FAILED"
reason = "Invalid account number"
    ↓
Update payout status to "FAILED"
    ↓
Send email to seller:
"Your payout failed. Please check bank details."
    ↓
Refund amount to available balance
    ↓
Seller can retry with correct details

Scenario B: Insufficient Xendit Balance
───────────────────────────────────────
Platform Xendit account has insufficient funds:
    ↓
Xendit returns error
    ↓
Keep payout status as "PENDING"
    ↓
Admin notification sent
    ↓
Retry after admin adds funds

Scenario C: Bank Network Issue
──────────────────────────────
Bank temporarily unavailable:
    ↓
Xendit retries automatically
    ↓
Status remains "PROCESSING"
    ↓
Eventually succeeds or fails
    ↓
Webhook sent with final status

Scenario D: Cancelled Payout
────────────────────────────
Seller cancels before processing:
    ↓
PUT /api/payouts/{id}/cancel
    ↓
Check status === "PENDING"
    ↓
Call Xendit cancel API
    ↓
Update status to "CANCELLED"
    ↓
Refund to available balance
```

**Key Features:**
- ✅ Real-time balance calculation
- ✅ Fee transparency
- ✅ Multiple bank support
- ✅ Webhook status updates
- ✅ Email notifications
- ✅ Error handling and retries
- ⚠️ TODO: Payout scheduling (weekly/monthly)
- ⚠️ TODO: Bulk payouts for multiple sellers

**Files Involved:**
- `/app/payout/page.tsx` - Payout request form
- `/app/dashboard/payouts/page.tsx` - Payout history
- `/app/api/payouts/route.ts` - POST (request), GET (list)
- `/app/api/payouts/[id]/route.ts` - GET (details), PUT (cancel)
- `/app/api/payouts/webhook/route.ts` - Xendit webhook
- `/lib/xendit-client.ts` - Disbursement API calls

---

## Email Notification Flows

### 7.1 Transactional Email Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Email Triggers Across Platform                                 │
└─────────────────────────────────────────────────────────────────┘

1. User Registration
   Trigger: User completes registration form
   → sendVerificationEmail()

2. Email Verification
   Trigger: User clicks verification link
   → sendWelcomeEmail() (optional)

3. Password Reset Request
   Trigger: User requests password reset
   → sendPasswordResetEmail()

4. Password Changed
   Trigger: User completes password reset
   → sendPasswordChangedNotification()

5. Purchase Confirmation
   Trigger: Payment webhook status = COMPLETED
   → sendPurchaseConfirmationEmail() (to buyer)
   → sendNewSaleNotificationEmail() (to seller)

6. Payout Requested
   Trigger: Seller submits payout request
   → sendPayoutRequestedEmail()

7. Payout Completed
   Trigger: Xendit webhook status = COMPLETED
   → sendPayoutCompletedEmail()

8. Payout Failed
   Trigger: Xendit webhook status = FAILED
   → sendPayoutFailedEmail()

9. Download Limit Reached
   Trigger: Customer exhausts downloads
   → sendDownloadLimitNotification()

10. Link Expired
    Trigger: Customer tries expired link
    → sendLinkExpiredNotification()

┌─────────────────────────────────────────────────────────────────┐
│ Email Sending Flow (Generic)                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Application triggers email:
sendEmail({
  to, subject, html, from
})
                            ↓
              [Email Service Layer]
              /lib/email.ts
                            ↓
              Try Resend (primary):
              ─────────────────────
              resend.emails.send({
                from: EMAIL_FROM,
                to: to,
                subject: subject,
                html: html
              })
                            ↓
                    ┌───────┴───────┐
                    │ Success?      │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            YES                             NO (Network error, etc.)
            ↓                               ↓
    Return success                  Fallback to AWS SES:
    Email queued                    ────────────────────
                                    sesClient.sendEmail({
                                      Source: EMAIL_FROM,
                                      Destination: { ToAddresses: [to] },
                                      Message: {
                                        Subject: { Data: subject },
                                        Body: { Html: { Data: html } }
                                      }
                                    })
                                            ↓
                                    ┌───────┴───────┐
                                    │ Success?      │
                                    └───────┬───────┘
                                            │
                            ┌───────────────┼───────────────┐
                            YES                             NO
                            ↓                               ↓
                    Return success                  Log error
                    Email queued                    Store in failed queue
                                                    Retry later (background job)
                            ↓
              Email delivered to recipient's inbox
              (or spam folder, if filters triggered)
```

**Files Involved:**
- `/lib/email.ts` - Email service
- `/lib/email-templates.ts` - HTML templates (if separate)

---

## Dashboard and Analytics Flows

### 8.1 Dashboard Data Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Seller Dashboard Load                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Seller navigates to /dashboard
                            ↓
              [Next.js Server Component]
              Runs on server before page render
                            ↓
              1. Get current user from JWT
                 const user = await getCurrentUser()
                            ↓
              2. Fetch dashboard stats (parallel)
                 ───────────────────────────────

                 Promise.all([
                   getProductCount(user.id),
                   getTotalSales(user.id),
                   getTotalRevenue(user.id),
                   getCustomerCount(user.id),
                   getRecentTransactions(user.id, 5),
                   getSalesByDate(user.id, 30)
                 ])
                            ↓
              3. Calculate metrics:

                 productCount = 15
                 totalSales = 120 purchases
                 totalRevenue = ₱150,000.00
                 uniqueCustomers = 85

                 recentTransactions = [
                   { date: "Jan 15", product: "Course A", amount: 999 },
                   { date: "Jan 14", product: "Template B", amount: 499 },
                   ...
                 ]

                 salesByDate = [
                   { date: "2025-01-01", sales: 5, revenue: 4995 },
                   { date: "2025-01-02", sales: 3, revenue: 2997 },
                   ...
                 ]
                            ↓
              4. Render dashboard with data:

              ┌──────────────────────────────────────────────────┐
              │ Dashboard Overview                               │
              ├──────────────────────────────────────────────────┤
              │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
              │ │ Products │ │  Sales   │ │ Revenue  │ │Cust. │ │
              │ │    15    │ │   120    │ │ ₱150K    │ │  85  │ │
              │ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
              │                                                  │
              │ Sales Chart (Last 30 Days)                       │
              │ ┌────────────────────────────────────────────┐   │
              │ │     📊 Line Chart (Recharts)              │   │
              │ │                                            │   │
              │ │                    ┌─┐                     │   │
              │ │               ┌─┐  │ │                     │   │
              │ │          ┌─┐  │ │  │ │  ┌─┐                │   │
              │ │     ┌─┐  │ │  │ │  │ │  │ │  ┌─┐           │   │
              │ │ ────┴─┴──┴─┴──┴─┴──┴─┴──┴─┴──┴─┴───────   │   │
              │ │  1   5   10  15  20  25  30 (days)        │   │
              │ └────────────────────────────────────────────┘   │
              │                                                  │
              │ Recent Transactions                              │
              │ ┌────────────────────────────────────────────┐   │
              │ │ Jan 15 │ Course A      │ buyer@... │ ₱999 │   │
              │ │ Jan 14 │ Template B    │ user@...  │ ₱499 │   │
              │ │ Jan 14 │ E-book C      │ test@...  │ ₱299 │   │
              │ └────────────────────────────────────────────┘   │
              │                                                  │
              │ [View All Products] [View All Sales]             │
              └──────────────────────────────────────────────────┘
```

**Performance Optimization:**
- Server-side data fetching (no client loading state)
- Parallel queries with Promise.all
- Caching dashboard data (future: Redis cache)
- Lazy load charts (dynamic import)

**Files Involved:**
- `/app/dashboard/page.tsx` - Dashboard page
- `/components/dashboard/DashboardHeader.tsx` - Header
- `/components/dashboard/StatsCards.tsx` - Metric cards
- `/components/dashboard/SalesChart.tsx` - Recharts component
- `/lib/supabase-db.ts` - Database queries

---

## Error Handling Flows

### 9.1 Global Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Error Types and Handling                                       │
└─────────────────────────────────────────────────────────────────┘

1. Validation Errors (400)
   Client input invalid
   → Return specific field errors
   → Show inline validation messages

2. Authentication Errors (401)
   Missing/invalid JWT
   → Redirect to /login
   → Preserve callbackUrl

3. Authorization Errors (403)
   User lacks permission
   → Show "Access Denied" page
   → Log security incident

4. Not Found Errors (404)
   Resource doesn't exist
   → Show helpful 404 page
   → Suggest alternatives

5. Rate Limit Errors (429)
   Too many requests
   → Return retry-after header
   → Show "Slow down" message

6. Server Errors (500)
   Unexpected error
   → Log to error tracking
   → Show generic error message
   → Don't expose internals

┌─────────────────────────────────────────────────────────────────┐
│ Error Flow Example: API Route Error                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
User makes API request
POST /api/products
                            ↓
              try {
                // Validate input
                const validated = productSchema.parse(body)

                // Business logic
                const product = await createProduct(validated)

                // Return success
                return NextResponse.json(product, { status: 201 })

              } catch (error) {
                            ↓
                    ┌───────┴───────┐
                    │ Error type?   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────────┐
        ZodError             DatabaseError          Unknown
        ↓                    ↓                      ↓
Validation failed      DB constraint          Unexpected error
Return 400             Return 409/500         Return 500
{                      {                      {
  "error": "Validation   "error": "Database    "error": "Internal
   failed",               error",                error",
  "details": {            "message": "Duplicate  "requestId": "abc123"
    "name": "Required",    slug"               }
    "price": "Must be >0" }
  }                                            Log to Sentry:
}                                              - Error stack
                                               - Request details
                                               - User context
                                               - Environment
              }
```

**Files Involved:**
- All API route files
- `/lib/error-handler.ts` - Centralized error handling (TODO)
- `/app/error.tsx` - React error boundary (TODO)

---

## Admin and Moderation Flows

### 10.1 Product Moderation Flow (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│ Content Moderation (Future Enhancement)                        │
└─────────────────────────────────────────────────────────────────┘

Currently: All products auto-published
Future: Manual or automated moderation

Flow:
1. Seller creates product → status: "pending_review"
2. Admin reviews product
3. Admin approves → status: "active"
   OR
   Admin rejects → status: "rejected", notify seller
4. Product visible to buyers only if "active"

TODO: Implement admin dashboard for moderation
```

---

## Summary

This document covers all major process flows in the Dotload platform:

✅ **Authentication**: Registration, Login, Password Reset
✅ **Product Management**: Creation, Editing, Publishing
✅ **Purchase Flow**: Complete checkout and payment process
✅ **Payment Processing**: E-Wallet, Card, Bank Transfer, QR Code
✅ **File Downloads**: Secure download with access control
✅ **Payouts**: Seller payout request and processing
✅ **Email Notifications**: All transactional emails
✅ **Dashboard**: Data loading and analytics
✅ **Error Handling**: Comprehensive error flows

Each flow includes:
- Step-by-step process
- Decision points
- Error scenarios
- Security measures
- Files involved
- Future enhancements
