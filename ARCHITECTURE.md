# Dotload - Comprehensive Architecture Documentation

> **Version:** 0.1.0
> **Created by:** Glenn Santos
> **Last Updated:** 2025-11-18

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Architecture Patterns](#architecture-patterns)
6. [Database Architecture](#database-architecture)
7. [API Documentation](#api-documentation)
8. [Frontend Architecture](#frontend-architecture)
9. [Authentication & Authorization](#authentication--authorization)
10. [Core Features](#core-features)
11. [Payment Processing](#payment-processing)
12. [Email System](#email-system)
13. [File Management](#file-management)
14. [Deployment Architecture](#deployment-architecture)
15. [Development Workflow](#development-workflow)
16. [Testing Strategy](#testing-strategy)
17. [Security Considerations](#security-considerations)
18. [Performance Optimization](#performance-optimization)
19. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

**Dotload** is a modern, full-stack SaaS digital marketplace platform that enables creators and sellers to monetize their digital products. Built with Next.js 15, React 18, and TypeScript, it provides a complete e-commerce solution with integrated payment processing, file delivery, and seller payout management.

### Key Capabilities

- **Digital Product Marketplace**: Create and sell digital products (courses, templates, software, e-books)
- **Multi-Payment Support**: Credit/debit cards, e-wallets (GCash, PayMaya), bank transfers, QR codes
- **Secure File Delivery**: Protected downloads with access controls and usage tracking
- **Seller Dashboard**: Analytics, sales tracking, revenue management
- **Automated Payouts**: Integrated payout system via Xendit
- **Product Variations**: Support for product options (colors, sizes, tiers)
- **Email Notifications**: Transactional emails for purchases, verifications, and notifications

### Technical Highlights

- **Framework**: Next.js 15.2.4 with App Router
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Authentication**: JWT-based with HTTP-only cookies
- **Payment Gateway**: Xendit integration
- **Email Service**: Resend + AWS SES
- **File Storage**: Cloudinary
- **Hosting**: Vercel with automatic deployments
- **Testing**: Jest + React Testing Library

---

## System Overview

### Application Type

Dotload is a **B2C (Business-to-Consumer) and B2B (Business-to-Business)** digital marketplace platform with two primary user roles:

1. **Sellers/Creators**: Create products, manage inventory, track sales, receive payouts
2. **Buyers/Customers**: Browse products, make purchases, download digital files

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│         React 18 + Next.js 15 + TypeScript                   │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Middleware Layer                    │
│         JWT Validation + Route Protection                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Application Layer (Next.js App)                 │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │  Server Pages    │  │    API Routes (REST)         │     │
│  │  (SSR/RSC)       │  │    /app/api/**/*.ts          │     │
│  └──────────────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (/lib)                     │
│  Service Classes + Utilities + Validation                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│           Data Access Layer (Supabase Client)                │
│         Prisma ORM + Database Service Classes                │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL via Supabase)              │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  Xendit (Payments) | Resend (Email) | Cloudinary (Files)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.4 | React framework with App Router, SSR, API routes |
| **React** | 18.3.1 | UI library for component-based interfaces |
| **TypeScript** | 5.1.0 | Static typing and enhanced developer experience |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible, unstyled UI primitives |
| **React Hook Form** | 7.54.1 | Form state management and validation |
| **Zod** | 3.24.1 | Schema validation |
| **React Quill** | 2.0.0 | Rich text editor for product descriptions |
| **Recharts** | 2.15.0 | Data visualization and charts |
| **Lucide React** | 0.454.0 | Icon library |
| **date-fns** | 3.6.0 | Date manipulation utilities |
| **Sonner** | 1.7.1 | Toast notifications |
| **clsx** + **cva** | Latest | Conditional CSS class utilities |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.x | JavaScript runtime |
| **Next.js API Routes** | 15.2.4 | RESTful API endpoints |
| **Prisma** | 6.7.0 | ORM for type-safe database access |
| **PostgreSQL** | 14+ | Relational database |
| **Supabase** | 2.50.0 | Managed PostgreSQL with additional features |
| **jose** | 6.0.11 | JWT token generation and verification |
| **bcryptjs** | 3.0.2 | Password hashing |
| **Xendit Node** | 6.3.0 | Payment gateway SDK |
| **Resend** | 4.5.1 | Email service |
| **Cloudinary** | 2.6.1 | File storage and CDN |
| **Axios** | 1.9.0 | HTTP client for external APIs |

### Development & Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 29.7.0 | Testing framework |
| **@testing-library/react** | 14.3.1 | React component testing |
| **ESLint** | 8.x | Code linting |
| **Docker** | Latest | Containerization for local development |
| **pnpm** | Latest | Package manager |
| **ts-jest** | 29.3.2 | TypeScript support for Jest |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting, CI/CD, serverless functions |
| **Supabase** | Managed PostgreSQL database |
| **Cloudinary** | Image and file hosting |
| **Xendit** | Payment processing gateway |
| **Resend** | Transactional email delivery |
| **AWS SES** | Email service (alternative) |

---

## Project Structure

```
/home/user/dotload/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes (RESTful endpoints)
│   │   ├── auth/                  # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── verify-email/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   ├── reset-password/route.ts
│   │   │   └── me/route.ts
│   │   ├── products/              # Product management
│   │   │   ├── route.ts           # GET (list), POST (create)
│   │   │   ├── [id]/route.ts      # GET, PUT, DELETE
│   │   │   ├── [id]/files/route.ts
│   │   │   └── [id]/variations/route.ts
│   │   ├── purchases/             # Purchase/order management
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── [id]/download/route.ts
│   │   ├── payments/              # Payment processing
│   │   │   ├── create/route.ts
│   │   │   ├── webhook/route.ts
│   │   │   ├── xendit/route.ts
│   │   │   └── status/route.ts
│   │   ├── user/                  # User management
│   │   │   ├── profile/route.ts
│   │   │   └── settings/route.ts
│   │   ├── transactions/          # Transaction history
│   │   ├── payouts/               # Payout management
│   │   ├── downloads/             # Secure file downloads
│   │   └── upload/route.ts        # File uploads
│   │
│   ├── dashboard/                 # Seller Dashboard Pages
│   │   ├── page.tsx               # Main dashboard
│   │   ├── sales/page.tsx         # Sales analytics
│   │   ├── purchases/page.tsx     # Order management
│   │   ├── customers/page.tsx     # Customer management
│   │   └── payouts/page.tsx       # Payout management
│   │
│   ├── products/                  # Product Management Pages
│   │   ├── page.tsx               # Product list
│   │   └── [id]/page.tsx          # Product details
│   │
│   ├── p/                         # Public Product Pages
│   │   └── [slug]/
│   │       ├── page.tsx           # Product display
│   │       ├── checkout/page.tsx  # Checkout flow
│   │       ├── success/page.tsx   # Purchase success
│   │       ├── failure/page.tsx   # Purchase failure
│   │       └── content/page.tsx   # Protected content access
│   │
│   ├── auth pages/                # Authentication Pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── settings/                  # User Settings
│   │   └── page.tsx
│   │
│   ├── buyer-dashboard/           # Buyer Dashboard
│   │   └── page.tsx
│   │
│   ├── layout.tsx                 # Root layout with auth
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles
│
├── components/                    # React Components
│   ├── ui/                        # Base UI Components (Radix)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   └── [60+ more components]
│   │
│   ├── auth/                      # Authentication Components
│   │   ├── auth-buttons.tsx
│   │   ├── AuthHeader.tsx
│   │   └── registration forms
│   │
│   ├── dashboard/                 # Dashboard Components
│   │   ├── DashboardHeader.tsx
│   │   ├── MobileMenu.tsx
│   │   └── analytics components
│   │
│   ├── payment/                   # Payment Components
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── CreditCardForm.tsx
│   │   └── EWalletForm.tsx
│   │
│   ├── home/                      # Landing Page Components
│   │   ├── hero-section.tsx
│   │   └── cta-section.tsx
│   │
│   ├── providers/                 # Context Providers
│   │   └── auth-provider.tsx
│   │
│   └── rich-text-editor.tsx       # Rich text editor
│
├── lib/                           # Utility Libraries & Services
│   ├── supabase-db.ts             # Database service layer
│   ├── auth-utils.ts              # Authentication utilities
│   ├── xendit-client.ts           # Payment gateway client
│   ├── email.ts                   # Email service
│   ├── file-utils.ts              # File handling
│   ├── purchase-utils.ts          # Purchase operations
│   ├── form-validation.ts         # Zod schemas
│   └── utils.ts                   # General utilities
│
├── hooks/                         # Custom React Hooks
│   ├── use-auth-state.tsx         # Authentication state
│   └── use-toast.ts               # Toast notifications
│
├── prisma/                        # Database Schema
│   ├── schema.prisma              # Prisma data models
│   └── migrations/                # Database migrations
│
├── tests/                         # Test Suite
│   ├── backend/                   # API route tests
│   ├── frontend/                  # Component tests
│   ├── integration/               # Integration tests
│   ├── e2e/                       # End-to-end tests
│   └── setup.ts                   # Test configuration
│
├── public/                        # Static Assets
│   ├── images/
│   └── favicon.ico
│
├── middleware.ts                  # Next.js Middleware (Auth)
├── next.config.js                 # Next.js Configuration
├── tailwind.config.ts             # Tailwind Configuration
├── tsconfig.json                  # TypeScript Configuration
├── jest.config.js                 # Jest Configuration
├── docker-compose.yml             # Docker Configuration
├── Dockerfile                     # Docker Image
├── vercel.json                    # Vercel Deployment Config
├── ecosystem.config.js            # PM2 Process Manager
├── package.json                   # Dependencies & Scripts
└── README.md                      # Project Documentation
```

---

## Architecture Patterns

### 1. Layered Architecture

The application follows a strict layered architecture pattern:

```
┌─────────────────────────────────────────┐
│   Presentation Layer                    │
│   - React Components                    │
│   - Pages (Server/Client Components)    │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│   Application Layer                     │
│   - API Routes                          │
│   - Custom Hooks                        │
│   - Form Handlers                       │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│   Business Logic Layer                  │
│   - Service Classes                     │
│   - Utility Functions                   │
│   - Validation Schemas                  │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│   Data Access Layer                     │
│   - Supabase Client                     │
│   - Prisma ORM                          │
│   - Database Service Classes            │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│   Database                              │
│   - PostgreSQL (Supabase)               │
└─────────────────────────────────────────┘
```

### 2. Service-Oriented Architecture

**Service Classes** (`/lib/supabase-db.ts`):

```typescript
// User Service
export class SupabaseUserService {
  async findUserByEmail(email: string): Promise<User | null>
  async findUserById(id: string): Promise<User | null>
  async createUser(userData: CreateUserData): Promise<User>
  async updateUser(id: string, data: UpdateUserData): Promise<User>
  async findUserByVerificationToken(token: string): Promise<User | null>
}

// Product Service
export class SupabaseProductService {
  async findProductById(id: string): Promise<Product | null>
  async findProductBySlug(slug: string): Promise<Product | null>
  async createProduct(productData: CreateProductData): Promise<Product>
  async updateProduct(id: string, data: UpdateProductData): Promise<Product>
  async deleteProduct(id: string): Promise<void>
  async getProductsByUserId(userId: string): Promise<Product[]>
}

// Purchase Service
export class SupabasePurchaseService {
  async createPurchase(data: CreatePurchaseData): Promise<Purchase>
  async findPurchaseById(id: string): Promise<Purchase | null>
  async updatePurchaseStatus(id: string, status: string): Promise<Purchase>
  async getAllUserRelatedPurchases(userId: string): Promise<Purchase[]>
}

// Service instances (singleton pattern)
export const supabaseUserService = new SupabaseUserService();
export const supabaseProductService = new SupabaseProductService();
export const supabasePurchaseService = new SupabasePurchaseService();
```

### 3. Repository Pattern

All database operations are abstracted through service classes, providing:
- **Centralized data access logic**
- **Easier testing** (mock services)
- **Consistent error handling**
- **Type safety** with TypeScript

### 4. Middleware Pattern

**JWT Authentication Middleware** (`/middleware.ts`):

```typescript
// Request Flow
Request → Middleware → Route Handler → Response

// Middleware responsibilities:
1. Extract JWT token from cookies
2. Verify token signature and expiration
3. Check user email verification status
4. Redirect to /login if unauthorized
5. Allow access to protected routes if authorized
```

### 5. Component-Based Architecture

React components follow **Atomic Design principles**:

```
Atoms (Base Components)
├── Button, Input, Card, Badge
└── Located in /components/ui/

Molecules (Composite Components)
├── PaymentMethodSelector
├── CreditCardForm
└── Located in /components/payment/

Organisms (Feature Components)
├── DashboardHeader
├── ProductForm
└── Located in /components/dashboard/

Templates (Page Layouts)
├── DashboardLayout
└── AuthLayout

Pages (Complete Views)
├── /app/dashboard/page.tsx
└── /app/products/page.tsx
```

### 6. Factory Pattern

Service instantiation and dependency injection:

```typescript
// Factory for creating service instances
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Services use factory to get clients
export const supabaseUserService = new SupabaseUserService();
```

### 7. Context API + Custom Hooks Pattern

**Global State Management**:

```typescript
// Auth Context Provider
<AuthProviderWrapper initialUser={currentUser}>
  {children}
</AuthProviderWrapper>

// Custom Hook
function useAuthState() {
  const context = useContext(AuthContext);
  return context;
}

// Usage in components
const { user, loading, logout } = useAuthState();
```

---

## Database Architecture

### Database Provider

- **Provider**: Supabase (Managed PostgreSQL)
- **Version**: PostgreSQL 14+
- **ORM**: Prisma 6.7.0
- **Schema Location**: `/prisma/schema.prisma`

### Entity Relationship Diagram

```
┌──────────────┐
│     User     │
├──────────────┤
│ id (CUID)    │──┐
│ email        │  │
│ password     │  │
│ name         │  │
│ emailVerified│  │
│ storeName    │  │
└──────────────┘  │
                  │
                  ├─ One-to-Many ──→ ┌──────────────┐
                  │                   │   Product    │
                  │                   ├──────────────┤
                  │                   │ id (CUID)    │──┐
                  │                   │ userId       │  │
                  │                   │ name         │  │
                  │                   │ price        │  │
                  │                   │ slug         │  │
                  │                   │ coverImage   │  │
                  │                   └──────────────┘  │
                  │                                     │
                  │                                     ├─ One-to-Many ──→ ┌──────────────┐
                  │                                     │                   │     File     │
                  │                                     │                   ├──────────────┤
                  │                                     │                   │ id (CUID)    │
                  │                                     │                   │ productId    │
                  │                                     │                   │ filename     │
                  │                                     │                   │ path         │
                  │                                     │                   └──────────────┘
                  │                                     │
                  │                                     ├─ One-to-Many ──→ ┌──────────────┐
                  │                                     │                   │  Variation   │
                  │                                     │                   ├──────────────┤
                  │                                     │                   │ id (CUID)    │
                  │                                     │                   │ productId    │
                  │                                     │                   │ name         │
                  │                                     │                   │ options      │
                  │                                     │                   └──────────────┘
                  │                                     │
                  │                                     └─ One-to-Many ──→ ┌──────────────┐
                  │                                                         │   Purchase   │
                  │                                                         ├──────────────┤
                  ├─ One-to-Many ──────────────────────────────────────────→│ id (CUID)    │
                  │                                                         │ productId    │
                  │                                                         │ userId       │
                  │                                                         │ email        │
                  │                                                         │ amount       │
                  │                                                         │ status       │
                  │                                                         │ accessCode   │
                  │                                                         └──────────────┘
                  │
                  ├─ One-to-Many ──→ ┌──────────────┐
                  │                   │ Transaction  │
                  │                   ├──────────────┤
                  │                   │ id (UUID)    │
                  │                   │ userId       │
                  │                   │ amount       │
                  │                   │ type         │
                  │                   │ status       │
                  │                   └──────────────┘
                  │
                  └─ One-to-Many ──→ ┌──────────────┐
                                      │    Payout    │
                                      ├──────────────┤
                                      │ id (UUID)    │
                                      │ userId       │
                                      │ amount       │
                                      │ status       │
                                      │ bankCode     │
                                      └──────────────┘
```

### Database Models

#### User Model

```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  password             String
  name                 String?
  emailVerified        Boolean   @default(false)
  verificationToken    String?   @unique
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Store branding
  storeDescription     String?
  storeHeaderPath      String?
  storeName            String?

  // Relations
  products             Product[]
  purchases            Purchase[]
  transactions         Transaction[]
  payouts              Payout[]
  passwordReset        PasswordReset?
}
```

#### Product Model

```prisma
model Product {
  id                   String      @id @default(cuid())
  name                 String
  price                Decimal     @db.Decimal(10, 2)
  description          String?     @db.Text
  userId               String
  type                 String?
  currency             String      @default("PHP")
  coverImagePath       String?
  digitalItemPath      String?
  slug                 String      @unique
  isPublic             Boolean     @default(true)
  status               String      @default("active")

  // Features
  allowPayWhatYouWant  Boolean     @default(false)
  offerCoupons         Boolean     @default(false)
  allowPreOrders       Boolean     @default(false)

  // Settings
  downloadLimit        Int?
  linkExpiration       Int?        // Days
  instantDownload      Boolean     @default(true)
  secureCheckout       Boolean     @default(true)

  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  // Relations
  user                 User        @relation(fields: [userId], references: [id])
  files                File[]
  purchases            Purchase[]
  variations           Variation[]

  @@index([userId])
  @@index([slug])
}
```

#### Purchase Model

```prisma
model Purchase {
  id                   String      @id @default(cuid())
  email                String
  mobileNumber         String?
  amount               Decimal     @db.Decimal(10, 2)
  paymentMethod        String
  paymentId            String?
  status               String      @default("pending") // pending, completed, failed, refunded
  accessCode           String      @unique
  productId            String
  userId               String?
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  // Relations
  product              Product     @relation(fields: [productId], references: [id])
  user                 User?       @relation(fields: [userId], references: [id])
  downloads            FileDownload[]

  @@index([productId])
  @@index([userId])
  @@index([accessCode])
}
```

#### File Model

```prisma
model File {
  id                   String      @id @default(cuid())
  filename             String
  path                 String
  mimetype             String?
  size                 Int?
  productId            String
  createdAt            DateTime    @default(now())

  // Relations
  product              Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  downloads            FileDownload[]

  @@index([productId])
}
```

#### FileDownload Model

```prisma
model FileDownload {
  id                   String      @id @default(cuid())
  fileId               String
  purchaseId           String
  userId               String?
  downloadedAt         DateTime    @default(now())
  userAgent            String?
  ipAddress            String?
  metadata             Json?

  // Relations
  file                 File        @relation(fields: [fileId], references: [id])
  purchase             Purchase    @relation(fields: [purchaseId], references: [id])

  @@index([fileId])
  @@index([purchaseId])
}
```

#### Transaction Model

```prisma
model Transaction {
  id                   String      @id @default(uuid())
  userId               String
  amount               Decimal     @db.Decimal(10, 2)
  type                 String      // sale, payout, refund
  status               String      // pending, completed, failed
  description          String?
  reference            String?
  metadata             Json?
  createdAt            DateTime    @default(now())

  // Relations
  user                 User        @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

#### Payout Model

```prisma
model Payout {
  id                   String      @id @default(uuid())
  userId               String
  amount               Decimal     @db.Decimal(10, 2)
  status               String      @default("PENDING") // PENDING, COMPLETED, FAILED, CANCELLED
  externalId           String?     @unique
  disbursementId       String?
  bankCode             String
  accountNumber        String
  accountHolderName    String
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  // Relations
  user                 User        @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### Database Connection

**Connection Pattern** (`/lib/supabase-db.ts`):

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

**Environment Variables**:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.project.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## API Documentation

### API Structure

All API routes follow RESTful conventions and are located in `/app/api/`.

### Authentication Endpoints

#### POST /api/auth/register
**Purpose**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "message": "Registration successful. Please check your email.",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Business Logic**:
1. Validate email format and password strength
2. Check if email already exists
3. Hash password with bcryptjs (10 salt rounds)
4. Generate verification token (crypto.randomBytes)
5. Create user record in database
6. Send verification email via Resend
7. Return success message

**File**: `/app/api/auth/register/route.ts`

---

#### POST /api/auth/login
**Purpose**: Authenticate user and create session

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Sets HTTP-only Cookie**:
```
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Path=/
HttpOnly=true
Secure=true (production)
SameSite=lax
Max-Age=86400 (24 hours)
```

**Business Logic**:
1. Find user by email
2. Compare password hash (bcryptjs.compare)
3. Verify email is verified
4. Generate JWT token (jose SignJWT):
   - Payload: { userId, email }
   - Algorithm: HS256
   - Expiry: 24 hours
5. Set HTTP-only cookie
6. Return user data

**File**: `/app/api/auth/login/route.ts`

---

#### POST /api/auth/verify-email
**Purpose**: Verify user email with token

**Request Body**:
```json
{
  "token": "verification_token_here"
}
```

**Response** (200 OK):
```json
{
  "message": "Email verified successfully"
}
```

**File**: `/app/api/auth/verify-email/route.ts`

---

#### POST /api/auth/forgot-password
**Purpose**: Initiate password reset flow

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

**Business Logic**:
1. Find user by email
2. Generate reset token (crypto.randomBytes)
3. Store token in PasswordReset table (expires in 1 hour)
4. Send reset email with link
5. Return success message

**File**: `/app/api/auth/forgot-password/route.ts`

---

### Product Management Endpoints

#### GET /api/products
**Purpose**: List all products (with optional filtering)

**Query Parameters**:
- `userId` - Filter by seller
- `status` - Filter by status (active/inactive)
- `limit` - Limit results
- `offset` - Pagination offset

**Response** (200 OK):
```json
{
  "products": [
    {
      "id": "clx123...",
      "name": "Premium Course",
      "price": 999.00,
      "slug": "premium-course",
      "coverImagePath": "https://cloudinary.com/...",
      "description": "Learn advanced techniques...",
      "userId": "user123",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

**File**: `/app/api/products/route.ts`

---

#### POST /api/products
**Purpose**: Create a new product

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "name": "My Digital Product",
  "description": "<p>Rich text description</p>",
  "price": 499.00,
  "type": "course",
  "coverImagePath": "https://cloudinary.com/...",
  "allowPayWhatYouWant": false,
  "downloadLimit": 3,
  "linkExpiration": 7,
  "variations": [
    {
      "name": "License Type",
      "options": ["Personal", "Commercial"]
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "clx456...",
    "slug": "my-digital-product",
    "name": "My Digital Product",
    "price": 499.00
  }
}
```

**Business Logic**:
1. Validate authentication token
2. Validate product data (Zod schema)
3. Generate unique slug from name
4. Upload cover image to Cloudinary (if provided)
5. Create product record
6. Create variation records (if provided)
7. Return product data

**File**: `/app/api/products/route.ts`

---

#### GET /api/products/[id]
**Purpose**: Get single product details

**Response** (200 OK):
```json
{
  "product": {
    "id": "clx123...",
    "name": "Premium Course",
    "description": "<p>Full description...</p>",
    "price": 999.00,
    "slug": "premium-course",
    "coverImagePath": "https://...",
    "user": {
      "name": "John Doe",
      "storeName": "John's Store"
    },
    "variations": [],
    "files": []
  }
}
```

**File**: `/app/api/products/[id]/route.ts`

---

#### PUT /api/products/[id]
**Purpose**: Update product

**Authentication**: Required (Owner only)

**Request Body**: Same as POST /api/products

**Response** (200 OK):
```json
{
  "message": "Product updated successfully",
  "product": { ... }
}
```

**File**: `/app/api/products/[id]/route.ts`

---

#### DELETE /api/products/[id]
**Purpose**: Delete product

**Authentication**: Required (Owner only)

**Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

**File**: `/app/api/products/[id]/route.ts`

---

### Payment Endpoints

#### POST /api/payments/create
**Purpose**: Create payment and initiate checkout

**Request Body**:
```json
{
  "productId": "clx123...",
  "email": "buyer@example.com",
  "mobileNumber": "+639171234567",
  "paymentMethod": "eWallet",
  "amount": 999.00,
  "variation": "Commercial License"
}
```

**Response** (200 OK):
```json
{
  "purchase": {
    "id": "purchase123",
    "accessCode": "ABC123XYZ",
    "status": "pending"
  },
  "redirectUrl": "https://checkout.xendit.co/web/...",
  "paymentId": "xendit_payment_123"
}
```

**Business Logic**:
1. Validate product exists and is available
2. Create Purchase record (status: pending)
3. Generate unique accessCode for download
4. Process payment via Xendit:
   - **Card**: createCardPayment()
   - **E-Wallet**: createEWalletPayment() (GCash, PayMaya, etc.)
   - **Bank Transfer**: createBankTransferPayment()
   - **QR Code**: createQrCodePayment()
5. Return payment redirect URL
6. Customer completes payment on Xendit
7. Webhook updates purchase status

**File**: `/app/api/payments/create/route.ts`

---

#### POST /api/payments/webhook
**Purpose**: Xendit payment webhook handler

**Headers**:
- `x-callback-token` - Xendit webhook verification token

**Request Body** (from Xendit):
```json
{
  "id": "payment_123",
  "external_id": "purchase_clx123",
  "status": "PAID",
  "amount": 999,
  "payment_method": "EWALLET",
  "paid_at": "2025-01-15T10:30:00Z"
}
```

**Business Logic**:
1. Verify webhook signature
2. Find purchase by external_id
3. Update purchase status to "completed"
4. Create transaction record
5. Send confirmation email to buyer
6. Send notification email to seller
7. Return 200 OK to Xendit

**File**: `/app/api/payments/webhook/route.ts`

---

### Download Endpoints

#### GET /api/downloads/secure/[token]
**Purpose**: Secure file download with access control

**Query Parameters**:
- `accessCode` - Purchase access code

**Response**: File stream (application/octet-stream)

**Headers**:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="file.pdf"
```

**Business Logic**:
1. Verify accessCode is valid
2. Find purchase and associated files
3. Check purchase status is "completed"
4. Verify download limit not exceeded
5. Check link expiration (if set)
6. Log download in FileDownload table:
   - Timestamp
   - User agent
   - IP address
7. Stream file from Cloudinary/storage
8. Increment download count

**File**: `/app/api/downloads/secure/[token]/route.ts`

---

### Payout Endpoints

#### POST /api/payouts
**Purpose**: Request payout to seller bank account

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 5000.00,
  "bankCode": "BDO",
  "accountNumber": "1234567890",
  "accountHolderName": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "message": "Payout requested successfully",
  "payout": {
    "id": "payout_uuid",
    "amount": 5000.00,
    "status": "PENDING",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Business Logic**:
1. Verify user has sufficient balance
2. Calculate fees:
   - Percentage fee: 5%
   - Fixed fee: ₱15
   - Net amount = amount - (amount × 0.05) - 15
3. Create Payout record (status: PENDING)
4. Call Xendit disbursement API
5. Store externalId and disbursementId
6. Return payout details

**File**: `/app/api/payouts/route.ts`

---

### File Upload Endpoint

#### POST /api/upload
**Purpose**: Upload files to Cloudinary

**Authentication**: Required

**Content-Type**: multipart/form-data

**Form Data**:
- `file` - File to upload
- `folder` - Cloudinary folder (optional)

**Response** (200 OK):
```json
{
  "url": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "dotload/products/abc123",
  "format": "jpg",
  "bytes": 125640
}
```

**File**: `/app/api/upload/route.ts`

---

## Frontend Architecture

### Routing Strategy

Dotload uses **Next.js App Router** with a clear separation between public and protected routes.

#### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/verify-email` - Email verification
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/p/[slug]` - Public product pages
- `/p/[slug]/checkout` - Checkout flow
- `/p/[slug]/success` - Purchase success
- `/p/[slug]/failure` - Purchase failure

#### Protected Routes (Require Authentication)
- `/dashboard` - Main dashboard
- `/dashboard/sales` - Sales analytics
- `/dashboard/purchases` - Order management
- `/dashboard/customers` - Customer list
- `/products` - Product management
- `/create-product` - Create product
- `/edit-product/[id]` - Edit product
- `/settings` - Account settings
- `/transactions` - Transaction history
- `/payout` - Payout management

### Component Architecture

#### Server Components (Default)

**Benefits**:
- Zero JavaScript sent to client
- Direct database access
- SEO-friendly
- Better performance

**Examples**:
```typescript
// app/dashboard/page.tsx
async function DashboardPage() {
  const user = await getCurrentUser();
  const products = await supabaseProductService.getProductsByUserId(user.id);
  const stats = await getDashboardStats(user.id);

  return <DashboardView products={products} stats={stats} />;
}
```

#### Client Components

**When to use**:
- Interactive elements (forms, buttons with onClick)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)
- Event handlers

**Examples**:
```typescript
'use client';

import { useState } from 'react';

export function PaymentForm() {
  const [method, setMethod] = useState('card');

  return (
    <form onSubmit={handleSubmit}>
      <PaymentMethodSelector value={method} onChange={setMethod} />
      {/* ... */}
    </form>
  );
}
```

### State Management

#### Global State (Auth Context)

**File**: `/components/providers/auth-provider.tsx`

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

export function AuthProviderWrapper({ initialUser, children }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Usage**:
```typescript
import { useAuthState } from '@/hooks/use-auth-state';

function DashboardHeader() {
  const { user, logout } = useAuthState();

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Local State (React Hook Form)

**Example**: Product Creation Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const productSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  description: z.string().optional()
});

function ProductForm() {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: ''
    }
  });

  const onSubmit = async (data) => {
    await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Styling System

#### Tailwind CSS Configuration

**File**: `/tailwind.config.ts`

```typescript
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... more color tokens
      }
    }
  }
};
```

#### CSS Variables

**File**: `/app/globals.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

#### Component Styling Pattern

```typescript
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        'rounded-md px-4 py-2 font-medium transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border border-input bg-background hover:bg-accent',
        className
      )}
      {...props}
    />
  );
}
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Registration                                    │
├─────────────────────────────────────────────────────────┤
│ User fills form → POST /api/auth/register              │
│ → Validate email/password                               │
│ → Hash password (bcryptjs, 10 rounds)                   │
│ → Create user (emailVerified: false)                    │
│ → Generate verification token (crypto.randomBytes)      │
│ → Send verification email                               │
│ → Show "Check your email" message                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Email Verification                                   │
├─────────────────────────────────────────────────────────┤
│ User clicks link in email                               │
│ → /verify-email?token=xyz                               │
│ → POST /api/auth/verify-email { token }                │
│ → Find user by token                                    │
│ → Update emailVerified = true                           │
│ → Clear verification token                              │
│ → Redirect to /login                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. User Login                                           │
├─────────────────────────────────────────────────────────┤
│ User submits login form → POST /api/auth/login         │
│ → Find user by email                                    │
│ → Compare password (bcryptjs.compare)                   │
│ → Check emailVerified === true                          │
│ → Generate JWT (jose SignJWT):                          │
│   - Payload: { userId, email }                          │
│   - Algorithm: HS256                                    │
│   - Expiry: 24h                                         │
│ → Set HTTP-only cookie                                  │
│ → Return user data                                      │
│ → Redirect to /dashboard                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Protected Route Access                               │
├─────────────────────────────────────────────────────────┤
│ User navigates to /dashboard                            │
│ → Middleware intercepts request                         │
│ → Extract token from cookie                             │
│ → Verify JWT signature (jose jwtVerify)                 │
│ → Check token not expired                               │
│ → Check emailVerified status                            │
│ → If valid: allow access                                │
│ → If invalid: redirect to /login?callbackUrl=/dashboard│
└─────────────────────────────────────────────────────────┘
```

### JWT Token Structure

**Token Payload**:
```json
{
  "userId": "clx123abc",
  "email": "user@example.com",
  "iat": 1705315200,
  "exp": 1705401600
}
```

**Token Generation** (`/app/api/auth/login/route.ts`):
```typescript
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const secret = new TextEncoder().encode(JWT_SECRET);

const token = await new SignJWT({ userId: user.id, email: user.email })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);
```

**Token Verification** (`/middleware.ts`):
```typescript
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(JWT_SECRET);
const { payload } = await jwtVerify(token, secret, {
  algorithms: ['HS256']
});
```

### Middleware Authorization

**File**: `/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - no auth required
  const publicRoutes = [
    '/', '/login', '/register', '/verify-email',
    '/forgot-password', '/reset-password'
  ];

  // Check if route is public
  if (publicRoutes.includes(pathname) || pathname.startsWith('/p/')) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // No token - redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check email verification
    if (payload.emailVerified === false && pathname !== '/verify-email') {
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }

    // Token valid - allow access
    return NextResponse.next();
  } catch (error) {
    // Invalid token - redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
}

// Routes to protect
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/settings/:path*',
    '/transactions/:path*',
    '/payout/:path*',
    '/api/products/:path*',
    '/api/user/:path*'
  ]
};
```

### Password Reset Flow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email → POST /api/auth/forgot-password
   ↓
3. System generates reset token (crypto.randomBytes(32))
   ↓
4. System creates PasswordReset record:
   - token (hashed)
   - expiresAt (1 hour from now)
   - userId
   ↓
5. System sends email with reset link:
   /reset-password?token=xyz
   ↓
6. User clicks link → /reset-password page
   ↓
7. User enters new password → POST /api/auth/reset-password
   ↓
8. System validates:
   - Token exists
   - Token not expired
   - Password meets requirements
   ↓
9. System updates:
   - Hash new password
   - Update user.password
   - Delete PasswordReset record
   ↓
10. User redirected to /login
```

### Security Best Practices

1. **Password Hashing**:
   - Algorithm: bcryptjs
   - Salt rounds: 10
   - Never store plain text passwords

2. **JWT Security**:
   - HTTP-only cookies (prevent XSS)
   - Secure flag in production
   - SameSite=lax (CSRF protection)
   - 24-hour expiration
   - HS256 algorithm

3. **Token Storage**:
   - Server-side: Environment variable (JWT_SECRET)
   - Client-side: HTTP-only cookie (not accessible to JavaScript)

4. **Email Verification**:
   - Required before full account access
   - Prevents fake account creation
   - Verification tokens expire

5. **Rate Limiting**:
   - Implement on auth endpoints
   - Prevent brute force attacks

---

## Core Features

### 1. Product Management

#### Product Creation Flow

```
Seller Dashboard → Create Product Button
   ↓
Product Creation Form (/create-product)
   ├─ Basic Info: Name, Description (Rich Text)
   ├─ Pricing: Price, Currency, Pay-What-You-Want
   ├─ Images: Cover Image Upload (Cloudinary)
   ├─ Files: Digital Files Upload
   ├─ Variations: Product Options (Color, Size, etc.)
   ├─ Settings:
   │  ├─ Download Limit (e.g., 3 downloads)
   │  ├─ Link Expiration (e.g., 7 days)
   │  ├─ Instant Download (yes/no)
   │  └─ Secure Checkout (yes/no)
   └─ Discount Codes (optional)
   ↓
Submit Form → POST /api/products
   ↓
Validation (Zod Schema)
   ↓
Generate Unique Slug (from name)
   ↓
Upload Files to Cloudinary
   ↓
Create Database Records:
   ├─ Product
   ├─ Files
   └─ Variations
   ↓
Redirect to Product Page
```

#### Product Schema

**File**: `/lib/form-validation.ts`

```typescript
const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  type: z.string().optional(),
  allowPayWhatYouWant: z.boolean().default(false),
  downloadLimit: z.number().int().positive().optional(),
  linkExpiration: z.number().int().positive().optional(),
  instantDownload: z.boolean().default(true),
  variations: z.array(z.object({
    name: z.string(),
    options: z.array(z.string())
  })).optional()
});
```

#### Product Variations

**Example Structure**:
```json
{
  "variations": [
    {
      "name": "License Type",
      "options": ["Personal", "Commercial", "Enterprise"]
    },
    {
      "name": "Format",
      "options": ["PDF", "EPUB", "MOBI"]
    }
  ]
}
```

**Database Storage**:
```prisma
model Variation {
  id        String   @id @default(cuid())
  name      String   // "License Type"
  options   Json     // ["Personal", "Commercial"]
  productId String
  product   Product  @relation(fields: [productId], references: [id])
}
```

### 2. Checkout System

#### Checkout Flow

```
Customer visits /p/[slug] (Product Page)
   ├─ View product details
   ├─ See price, description, images
   └─ Click "Buy Now"
   ↓
Redirect to /p/[slug]/checkout
   ↓
Checkout Form:
   ├─ Email (pre-filled if logged in)
   ├─ Mobile Number
   ├─ Select Variation (if applicable)
   ├─ Payment Method:
   │  ├─ Credit/Debit Card
   │  ├─ E-Wallet (GCash, PayMaya, etc.)
   │  ├─ Bank Transfer
   │  └─ QR Code
   └─ Apply Discount Code (optional)
   ↓
Submit → POST /api/payments/create
   ↓
Backend Processing:
   ├─ Validate product exists
   ├─ Create Purchase record (status: pending)
   ├─ Generate unique accessCode
   ├─ Process payment via Xendit:
   │  ├─ Create invoice/charge
   │  ├─ Get payment redirect URL
   │  └─ Store paymentId
   └─ Return redirect URL
   ↓
Redirect customer to Xendit checkout
   ↓
Customer completes payment on Xendit
   ↓
Xendit sends webhook → POST /api/payments/webhook
   ├─ Verify signature
   ├─ Update Purchase status to "completed"
   ├─ Create Transaction record
   ├─ Send confirmation email to buyer
   └─ Send notification to seller
   ↓
Redirect to /p/[slug]/success?code=accessCode
   ├─ Display success message
   ├─ Show download link
   └─ Access code for future downloads
```

#### Payment Methods Implementation

**E-Wallet Payment** (`/lib/xendit-client.ts`):
```typescript
async function createEWalletPayment({
  amount,
  email,
  mobileNumber,
  externalId,
  channelCode // 'GCASH', 'PAYMAYA', 'GRABPAY'
}) {
  const response = await xenditClient.EWallet.createEWalletCharge({
    referenceId: externalId,
    currency: 'PHP',
    amount,
    checkoutMethod: 'ONE_TIME_PAYMENT',
    channelCode,
    channelProperties: {
      successRedirectUrl: `${DOMAIN}/p/${slug}/success`,
      failureRedirectUrl: `${DOMAIN}/p/${slug}/failure`
    },
    metadata: {
      email,
      mobileNumber
    }
  });

  return {
    paymentId: response.id,
    redirectUrl: response.actions.mobile_web_checkout_url
  };
}
```

**Card Payment**:
```typescript
async function createCardPayment({
  amount,
  email,
  cardDetails,
  externalId
}) {
  const response = await xenditClient.Card.createCharge({
    externalId,
    amount,
    cardData: {
      cardNumber: cardDetails.number,
      cardExpMonth: cardDetails.expMonth,
      cardExpYear: cardDetails.expYear,
      cardCvn: cardDetails.cvv
    },
    capture: true,
    descriptor: 'Dotload Purchase'
  });

  return {
    paymentId: response.id,
    status: response.status
  };
}
```

### 3. File Download System

#### Secure Download Flow

```
Buyer visits /p/[slug]/success?code=ABC123
   ↓
Click "Download Files"
   ↓
Request: GET /api/downloads/secure?accessCode=ABC123
   ↓
Backend Validation:
   ├─ Find Purchase by accessCode
   ├─ Verify purchase.status === "completed"
   ├─ Check download limit:
   │  ├─ Count existing downloads (FileDownload table)
   │  ├─ Compare with product.downloadLimit
   │  └─ Reject if limit exceeded
   ├─ Check link expiration:
   │  ├─ Calculate: purchase.createdAt + product.linkExpiration
   │  └─ Reject if expired
   └─ All checks passed
   ↓
Log Download:
   ├─ Create FileDownload record:
   │  ├─ fileId
   │  ├─ purchaseId
   │  ├─ downloadedAt (now)
   │  ├─ userAgent (browser info)
   │  ├─ ipAddress
   │  └─ metadata (JSON)
   ↓
Stream File:
   ├─ Fetch file from Cloudinary
   ├─ Set headers:
   │  ├─ Content-Type: application/octet-stream
   │  ├─ Content-Disposition: attachment; filename="file.pdf"
   │  └─ Content-Length: file.size
   └─ Stream file to client
```

#### Download Tracking

**FileDownload Model**:
```typescript
{
  id: "download_123",
  fileId: "file_abc",
  purchaseId: "purchase_xyz",
  downloadedAt: "2025-01-15T10:30:00Z",
  userAgent: "Mozilla/5.0 ...",
  ipAddress: "123.45.67.89",
  metadata: {
    "downloadSource": "success_page",
    "deviceType": "mobile"
  }
}
```

**Analytics Usage**:
- Track download patterns
- Identify popular products
- Detect suspicious download activity
- Generate seller reports

### 4. Dashboard & Analytics

#### Dashboard Stats Calculation

**File**: `/app/dashboard/page.tsx`

```typescript
async function getDashboardStats(userId: string) {
  // Get all user products
  const products = await supabaseProductService.getProductsByUserId(userId);
  const productCount = products.length;

  // Get all purchases for user's products
  const purchases = await supabasePurchaseService.getAllUserRelatedPurchases(userId);

  // Calculate total sales
  const completedPurchases = purchases.filter(p => p.status === 'completed');
  const totalSales = completedPurchases.length;

  // Calculate total revenue
  const totalRevenue = completedPurchases.reduce((sum, p) => {
    return sum + parseFloat(p.amount);
  }, 0);

  // Get unique customers
  const uniqueCustomers = new Set(completedPurchases.map(p => p.email));
  const customerCount = uniqueCustomers.size;

  // Get recent transactions
  const recentTransactions = await getRecentTransactions(userId, 5);

  // Get sales by date (for chart)
  const salesByDate = await getSalesByDate(userId, 30); // Last 30 days

  return {
    productCount,
    totalSales,
    totalRevenue,
    customerCount,
    recentTransactions,
    salesByDate
  };
}
```

#### Sales Chart Data

**Example Data Structure**:
```json
{
  "salesByDate": [
    { "date": "2025-01-01", "sales": 5, "revenue": 4995.00 },
    { "date": "2025-01-02", "sales": 3, "revenue": 2997.00 },
    { "date": "2025-01-03", "sales": 8, "revenue": 7992.00 }
  ]
}
```

**Chart Component** (Recharts):
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function SalesChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
      <Line type="monotone" dataKey="sales" stroke="#82ca9d" />
    </LineChart>
  );
}
```

### 5. Payout System

#### Payout Request Flow

```
Seller Dashboard → Payout Management
   ↓
View Available Balance:
   ├─ Total revenue from completed purchases
   ├─ Minus previous payouts
   └─ Minus pending payouts
   ↓
Request Payout Form:
   ├─ Amount (max: available balance)
   ├─ Bank Details:
   │  ├─ Bank Code (e.g., "BDO", "BPI")
   │  ├─ Account Number
   │  └─ Account Holder Name
   └─ Submit
   ↓
POST /api/payouts
   ↓
Backend Validation:
   ├─ Verify user has sufficient balance
   ├─ Calculate fees:
   │  ├─ Percentage fee: 5%
   │  ├─ Fixed fee: ₱15
   │  └─ Net amount = amount - (amount × 0.05) - 15
   └─ Minimum payout: ₱100
   ↓
Create Payout Record (status: PENDING)
   ↓
Xendit Disbursement API:
   ├─ Create disbursement request
   ├─ Store externalId
   └─ Store disbursementId
   ↓
Update Payout Record:
   ├─ externalId (Xendit reference)
   ├─ disbursementId
   └─ status: PENDING
   ↓
Xendit processes payout (async)
   ↓
Xendit webhook updates status:
   ├─ COMPLETED
   ├─ FAILED
   └─ CANCELLED
   ↓
Send email notification to seller
```

#### Fee Configuration

**Environment Variables** (`.env`):
```bash
PAYOUT_PERCENTAGE_FEE=0.05  # 5%
PAYOUT_FIXED_FEE=15         # ₱15
```

**Fee Calculation Example**:
```
Payout Request: ₱10,000
Percentage Fee: ₱10,000 × 0.05 = ₱500
Fixed Fee: ₱15
Net Payout: ₱10,000 - ₱500 - ₱15 = ₱9,485
```

---

## Payment Processing

### Xendit Integration

#### Configuration

**Environment Variables**:
```bash
XENDIT_API_KEY=xnd_production_xxx
XENDIT_SECRET_KEY=secret_xxx
XENDIT_WEBHOOK_SECRET=webhook_secret_xxx
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_xxx
```

**Xendit Client Setup** (`/lib/xendit-client.ts`):
```typescript
import Xendit from 'xendit-node';

const XENDIT_API_KEY = process.env.XENDIT_API_KEY;
const xenditClient = new Xendit({ secretKey: XENDIT_API_KEY });

export default xenditClient;
```

### Supported Payment Methods

#### 1. E-Wallets

**Supported Channels**:
- GCash
- PayMaya (now Maya)
- GrabPay
- ShopeePay

**Implementation**:
```typescript
async function createEWalletPayment({
  amount,
  email,
  mobileNumber,
  channelCode,
  externalId,
  productSlug
}) {
  const charge = await xenditClient.EWallet.createEWalletCharge({
    referenceId: externalId,
    currency: 'PHP',
    amount: amount,
    checkoutMethod: 'ONE_TIME_PAYMENT',
    channelCode: channelCode, // 'ID_GCASH', 'PH_PAYMAYA', etc.
    channelProperties: {
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${productSlug}/success?code=${externalId}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${productSlug}/failure`
    },
    customer: {
      email: email,
      mobileNumber: mobileNumber
    },
    metadata: {
      productSlug,
      purchaseId: externalId
    }
  });

  return {
    paymentId: charge.id,
    redirectUrl: charge.actions.mobile_web_checkout_url,
    status: charge.status
  };
}
```

#### 2. Credit/Debit Cards

**Implementation**:
```typescript
async function createCardPayment({
  amount,
  email,
  cardDetails,
  externalId
}) {
  const charge = await xenditClient.Card.createCharge({
    externalId: externalId,
    amount: amount,
    cardData: {
      cardNumber: cardDetails.cardNumber,
      cardExpMonth: cardDetails.expiryMonth,
      cardExpYear: cardDetails.expiryYear,
      cardCvn: cardDetails.cvv
    },
    isAuthenticationActivated: true,
    capture: true,
    descriptor: 'Dotload Purchase',
    customer: {
      email: email
    }
  });

  return {
    paymentId: charge.id,
    authenticationUrl: charge.payer_authentication_url,
    status: charge.status
  };
}
```

#### 3. Bank Transfers

**Supported Banks** (Philippines):
- BPI
- BDO
- UnionBank
- Metrobank
- LandBank

**Implementation**:
```typescript
async function createBankTransferPayment({
  amount,
  email,
  externalId,
  bankCode
}) {
  const virtualAccount = await xenditClient.VirtualAcc.createFixedVA({
    externalId: externalId,
    bankCode: bankCode, // 'BPI', 'BDO', etc.
    name: email,
    expectedAmount: amount,
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  return {
    accountNumber: virtualAccount.account_number,
    bankCode: virtualAccount.bank_code,
    expiresAt: virtualAccount.expiration_date,
    status: 'pending'
  };
}
```

#### 4. QR Code Payments

**Implementation**:
```typescript
async function createQrCodePayment({
  amount,
  email,
  externalId,
  type = 'DYNAMIC' // or 'STATIC'
}) {
  const qrCode = await xenditClient.QrCode.create({
    externalId: externalId,
    type: type,
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
    amount: amount
  });

  return {
    qrCodeUrl: qrCode.qr_string,
    qrCodeId: qrCode.id,
    expiresAt: qrCode.expires_at,
    status: 'pending'
  };
}
```

### Webhook Handling

**Endpoint**: `POST /api/payments/webhook`

**File**: `/app/api/payments/webhook/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify webhook signature
  const signature = request.headers.get('x-callback-token');
  const expectedSignature = process.env.XENDIT_WEBHOOK_SECRET;

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Extract payment data
  const {
    id: paymentId,
    external_id: externalId,
    status,
    amount,
    payment_method,
    paid_at
  } = body;

  // Find purchase by external_id
  const purchase = await supabasePurchaseService.findPurchaseByAccessCode(externalId);

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // Update purchase status based on payment status
  let newStatus = 'pending';
  if (status === 'PAID' || status === 'SUCCEEDED') {
    newStatus = 'completed';
  } else if (status === 'FAILED') {
    newStatus = 'failed';
  }

  // Update purchase
  await supabasePurchaseService.updatePurchaseStatus(purchase.id, newStatus);

  // Create transaction record
  if (newStatus === 'completed') {
    await createTransaction({
      userId: purchase.product.userId,
      amount: amount,
      type: 'sale',
      status: 'completed',
      reference: paymentId,
      metadata: {
        purchaseId: purchase.id,
        paymentMethod: payment_method,
        paidAt: paid_at
      }
    });

    // Send confirmation emails
    await sendPurchaseConfirmationEmail(purchase);
    await sendSellerNotificationEmail(purchase);
  }

  // Return success to Xendit
  return NextResponse.json({ success: true });
}
```

### Payment Status Flow

```
┌─────────────┐
│   PENDING   │ ← Purchase created, awaiting payment
└─────────────┘
       ↓
┌─────────────┐
│   PAID      │ ← Xendit confirms payment (via webhook)
└─────────────┘
       ↓
┌─────────────┐
│  COMPLETED  │ ← Internal status update
└─────────────┘
       ↓
   [Success Page + Download Access]

   OR

┌─────────────┐
│   FAILED    │ ← Payment failed/expired
└─────────────┘
       ↓
   [Failure Page + Retry Option]
```

---

## Email System

### Email Service Configuration

**Provider**: Resend (Primary) + AWS SES (Fallback)

**Environment Variables**:
```bash
RESEND_API_KEY=re_xxx
EMAIL_FROM=Dotload <no-reply@dotload.com>
DOMAIN=dotload.com

# AWS SES (Fallback)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

### Email Service Implementation

**File**: `/lib/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Dotload <no-reply@dotload.com>';
const DOMAIN = process.env.DOMAIN || 'localhost:2222';

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string
) {
  const verificationUrl = `https://${DOMAIN}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: to,
    subject: 'Verify your email - Dotload',
    html: `
      <h1>Welcome to Dotload, ${name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string
) {
  const resetUrl = `https://${DOMAIN}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: to,
    subject: 'Reset your password - Dotload',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
}

export async function sendPurchaseConfirmationEmail(
  to: string,
  productName: string,
  accessCode: string,
  downloadUrl: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: to,
    subject: `Your purchase of ${productName} - Dotload`,
    html: `
      <h1>Purchase Successful!</h1>
      <p>Thank you for your purchase of <strong>${productName}</strong>.</p>
      <h2>Download Your Files</h2>
      <p>Click the link below to download your files:</p>
      <a href="${downloadUrl}">Download Now</a>
      <p><strong>Access Code:</strong> ${accessCode}</p>
      <p>Save this access code for future downloads.</p>
      <hr />
      <p>Need help? Contact support at support@dotload.com</p>
    `
  });
}

export async function sendSellerNotificationEmail(
  to: string,
  productName: string,
  buyerEmail: string,
  amount: number
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: to,
    subject: `New sale: ${productName} - Dotload`,
    html: `
      <h1>New Sale Notification</h1>
      <p>You have a new sale!</p>
      <ul>
        <li><strong>Product:</strong> ${productName}</li>
        <li><strong>Buyer:</strong> ${buyerEmail}</li>
        <li><strong>Amount:</strong> ₱${amount.toFixed(2)}</li>
      </ul>
      <p>View your dashboard for more details.</p>
      <a href="https://${DOMAIN}/dashboard">Go to Dashboard</a>
    `
  });
}
```

### Email Templates

#### 1. Verification Email

**Subject**: `Verify your email - Dotload`

**Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background-color: #4CAF50; color: white; padding: 15px 32px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Dotload, {{name}}!</h1>
    <p>Please verify your email address to activate your account.</p>
    <a href="{{verificationUrl}}" class="button">Verify Email</a>
    <p>Or copy and paste this link:</p>
    <p>{{verificationUrl}}</p>
    <p>This link expires in 24 hours.</p>
  </div>
</body>
</html>
```

#### 2. Purchase Confirmation Email

**Subject**: `Your purchase of {{productName}} - Dotload`

**Template**:
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <h1>🎉 Purchase Successful!</h1>
    <p>Thank you for purchasing <strong>{{productName}}</strong>.</p>

    <div class="info-box">
      <h2>📦 Download Your Files</h2>
      <a href="{{downloadUrl}}" class="button">Download Now</a>
      <p><strong>Access Code:</strong> <code>{{accessCode}}</code></p>
      <p>Save this code for future downloads.</p>
    </div>

    <h3>Order Details:</h3>
    <ul>
      <li>Product: {{productName}}</li>
      <li>Amount: ₱{{amount}}</li>
      <li>Date: {{purchaseDate}}</li>
    </ul>

    <p>Need help? Contact support@dotload.com</p>
  </div>
</body>
</html>
```

#### 3. Seller Notification Email

**Subject**: `New sale: {{productName}}`

**Template**:
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <h1>💰 New Sale!</h1>
    <p>Congratulations! You have a new sale.</p>

    <div class="info-box">
      <ul>
        <li><strong>Product:</strong> {{productName}}</li>
        <li><strong>Buyer:</strong> {{buyerEmail}}</li>
        <li><strong>Amount:</strong> ₱{{amount}}</li>
        <li><strong>Date:</strong> {{saleDate}}</li>
      </ul>
    </div>

    <a href="{{dashboardUrl}}" class="button">View Dashboard</a>
  </div>
</body>
</html>
```

---

## File Management

### File Storage

**Provider**: Cloudinary

**Configuration**:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### File Upload Implementation

**Endpoint**: `POST /api/upload`

**File**: `/app/api/upload/route.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') || 'dotload';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes
  });
}
```

### File Download Protection

**Implementation**: `/app/api/downloads/secure/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessCode = searchParams.get('accessCode');

  if (!accessCode) {
    return NextResponse.json({ error: 'Access code required' }, { status: 400 });
  }

  // Find purchase by access code
  const purchase = await supabasePurchaseService.findPurchaseByAccessCode(accessCode);

  if (!purchase || purchase.status !== 'completed') {
    return NextResponse.json({ error: 'Invalid or incomplete purchase' }, { status: 403 });
  }

  // Get product and files
  const product = await supabaseProductService.findProductById(purchase.productId);
  const files = await getProductFiles(product.id);

  // Check download limit
  if (product.downloadLimit) {
    const downloadCount = await getDownloadCount(purchase.id);
    if (downloadCount >= product.downloadLimit) {
      return NextResponse.json({ error: 'Download limit exceeded' }, { status: 403 });
    }
  }

  // Check link expiration
  if (product.linkExpiration) {
    const expiryDate = new Date(purchase.createdAt);
    expiryDate.setDate(expiryDate.getDate() + product.linkExpiration);

    if (new Date() > expiryDate) {
      return NextResponse.json({ error: 'Download link expired' }, { status: 403 });
    }
  }

  // Log download
  await logFileDownload({
    fileId: files[0].id,
    purchaseId: purchase.id,
    userAgent: request.headers.get('user-agent'),
    ipAddress: request.headers.get('x-forwarded-for') || request.ip
  });

  // Fetch file from Cloudinary
  const fileUrl = files[0].path;
  const fileResponse = await fetch(fileUrl);
  const fileBlob = await fileResponse.blob();

  // Return file
  return new NextResponse(fileBlob, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${files[0].filename}"`
    }
  });
}
```

### Supported File Types

**Categories**:
1. **Documents**: PDF, DOCX, DOC, TXT, RTF, ODT
2. **Archives**: ZIP, RAR, 7Z, TAR, GZ
3. **Images**: JPG, PNG, GIF, SVG, WebP, PSD, AI
4. **Videos**: MP4, AVI, MOV, WMV, FLV, MKV
5. **Audio**: MP3, WAV, FLAC, AAC, OGG
6. **Code**: JS, TS, PY, JAVA, CPP, HTML, CSS
7. **Data**: JSON, XML, CSV, SQL, XLSX

**File Size Limits**:
- Maximum file size: 100 MB (configurable)
- Maximum total product size: 500 MB (configurable)

---

## Deployment Architecture

### Production Environment

```
┌───────────────────────────────────────────────┐
│           Vercel (Hosting Platform)           │
│  ┌─────────────────────────────────────────┐  │
│  │     Next.js Application                 │  │
│  │  - Server-Side Rendering (SSR)          │  │
│  │  - API Routes (Serverless Functions)    │  │
│  │  - Static Generation (SSG)              │  │
│  │  - Edge Middleware                      │  │
│  └─────────────────────────────────────────┘  │
│  Region: Singapore (sin1)                     │
│  Node.js: 22.x                                │
│  Auto-Deploy: amplify-deployment branch       │
└───────────────────────────────────────────────┘
                      ↓ ↑
┌───────────────────────────────────────────────┐
│      Supabase (Database Platform)             │
│  ┌─────────────────────────────────────────┐  │
│  │     PostgreSQL 14+                      │  │
│  │  - Connection Pooling                   │  │
│  │  - Auto Backups                         │  │
│  │  - Point-in-Time Recovery               │  │
│  └─────────────────────────────────────────┘  │
│  Project: hjihiagddnhgrwrtbwsv                │
│  Region: Singapore (ap-southeast-1)           │
└───────────────────────────────────────────────┘
                      ↓ ↑
┌───────────────────────────────────────────────┐
│          External Services                    │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Xendit     │  │    Cloudinary        │   │
│  │  (Payments)  │  │  (File Storage)      │   │
│  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Resend     │  │    AWS SES           │   │
│  │  (Email)     │  │  (Email Backup)      │   │
│  └──────────────┘  └──────────────────────┘   │
└───────────────────────────────────────────────┘
```

### Deployment Configuration

**File**: `/vercel.json`

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

### Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.hjihiagddnhgrwrtbwsv.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://hjihiagddnhgrwrtbwsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
NEXT_PUBLIC_BASE_URL=https://dotload-friends-projects-5a78b24f.vercel.app
DOMAIN=dotload-friends-projects-5a78b24f.vercel.app
NODE_ENV=production

# Authentication
JWT_SECRET=production_secret_key_here

# Payments
XENDIT_API_KEY=xnd_production_xxx
XENDIT_SECRET_KEY=secret_production_xxx
XENDIT_WEBHOOK_SECRET=webhook_secret_xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=Dotload <no-reply@dotload.com>

# File Storage
CLOUDINARY_CLOUD_NAME=dotload
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_URL=cloudinary://xxx:xxx@dotload

# Fees
PAYOUT_PERCENTAGE_FEE=0.05
PAYOUT_FIXED_FEE=15
```

### Continuous Deployment

**Workflow**:
```
1. Developer pushes to `claude/add-codebase-documentation-019tYbFC8uVbMbUG4wNUum66` branch
   ↓
2. GitHub webhook triggers Vercel
   ↓
3. Vercel builds application:
   - npm install
   - prisma generate
   - next build
   ↓
4. Run automated tests (if configured)
   ↓
5. Deploy to preview URL
   ↓
6. Merge to `amplify-deployment` branch
   ↓
7. Auto-deploy to production URL
   ↓
8. Vercel runs health checks
   ↓
9. Deployment complete
```

---

## Development Workflow

### Local Development Setup

**Prerequisites**:
- Node.js 22.x
- pnpm package manager
- PostgreSQL 14+ (or Supabase account)
- Git

**Steps**:
```bash
# 1. Clone repository
git clone https://github.com/glennsantos/dotload.git
cd dotload

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Set up database
pnpm prisma migrate dev

# 5. Seed test data (optional)
pnpm seed

# 6. Run development server
pnpm dev

# 7. Open browser
# http://localhost:2222
```

### Available Scripts

```json
{
  "dev": "next dev -p 2222",
  "build": "prisma generate && next build",
  "start": "next start -p 2222",
  "postinstall": "prisma generate",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:backend": "jest tests/backend --testEnvironment=node",
  "test:frontend": "jest tests/frontend --testEnvironment=jsdom",
  "test:ci": "jest --ci --coverage --watchAll=false",
  "seed": "tsx ./scripts/seed-test-data.ts"
}
```

### Database Migrations

**Create migration**:
```bash
pnpm prisma migrate dev --name add_new_feature
```

**Apply migrations**:
```bash
# Development
pnpm prisma migrate dev

# Production
pnpm prisma migrate deploy
```

**Reset database**:
```bash
pnpm prisma migrate reset
```

### Docker Development

**File**: `/docker-compose.yml`

```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: dotload
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "2222:2222"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/dotload

volumes:
  postgres_data:
```

**Commands**:
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild
docker-compose up --build
```

---

## Testing Strategy

### Test Structure

```
tests/
├── backend/              # API route tests (Node.js env)
│   ├── auth.test.ts
│   ├── products.test.ts
│   └── payments.test.ts
├── frontend/             # Component tests (jsdom env)
│   ├── auth/
│   │   ├── login.test.tsx
│   │   └── registration.test.tsx
│   ├── products/
│   │   ├── product-creation.test.tsx
│   │   └── product-edit.test.tsx
│   └── checkout/
│       └── checkout.test.tsx
├── integration/          # Full-stack tests
│   └── purchase-flow.test.ts
└── setup.ts             # Test configuration
```

### Test Configuration

**File**: `/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};
```

### Example Tests

**Backend Test** (`tests/backend/auth.test.ts`):
```typescript
import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should reject invalid password', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

**Frontend Test** (`tests/frontend/auth/login.test.tsx`):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';

describe('Login Page', () => {
  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors', async () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific suite
pnpm test:backend
pnpm test:frontend

# Watch mode
pnpm test:watch

# CI mode (non-interactive)
pnpm test:ci
```

---

## Security Considerations

### 1. Authentication Security

**Password Security**:
- Minimum 8 characters
- bcryptjs with 10 salt rounds
- Never log or display passwords

**JWT Security**:
- HTTP-only cookies (prevent XSS)
- Secure flag in production (HTTPS only)
- SameSite=lax (CSRF protection)
- 24-hour expiration
- HS256 algorithm with strong secret

### 2. API Security

**Input Validation**:
- Zod schemas for all inputs
- Sanitize user inputs
- Validate file uploads (type, size)

**Rate Limiting**:
- Implement on auth endpoints
- Prevent brute force attacks
- Use Vercel rate limiting or custom middleware

**CORS Configuration**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ];
  }
};
```

### 3. Data Security

**Database Security**:
- Parameterized queries (Prisma ORM)
- No raw SQL queries with user input
- Service role key for server-only operations
- Row-level security (RLS) in Supabase

**Environment Variables**:
- Never commit .env files
- Use Vercel environment variables
- Rotate secrets regularly
- Different keys for dev/staging/production

### 4. Payment Security

**Xendit Integration**:
- Verify webhook signatures
- Use HTTPS for all callbacks
- Never expose secret keys client-side
- Log all payment transactions

### 5. File Security

**Upload Security**:
- Validate file types (whitelist)
- Scan for malware (future enhancement)
- Limit file sizes
- Use signed URLs for downloads

**Download Security**:
- Access code verification
- Time-based link expiration
- Download limit enforcement
- IP and user agent logging

---

## Performance Optimization

### 1. Next.js Optimizations

**Static Generation**:
```typescript
// Generate static product pages
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map(p => ({ slug: p.slug }));
}
```

**Image Optimization**:
```typescript
import Image from 'next/image';

<Image
  src={product.coverImagePath}
  alt={product.name}
  width={600}
  height={400}
  priority={false}
  loading="lazy"
/>
```

**Code Splitting**:
```typescript
// Dynamic imports for large components
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});
```

### 2. Database Optimizations

**Indexes**:
```prisma
model Product {
  // ...
  @@index([userId])
  @@index([slug])
  @@index([status])
}
```

**Connection Pooling**:
- Supabase provides automatic connection pooling
- Reuse database connections
- Close connections after use

### 3. Caching Strategy

**API Route Caching**:
```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  });
}
```

**CDN Caching** (Cloudinary):
- Images cached globally
- Automatic format optimization (WebP)
- Responsive image delivery

### 4. Bundle Optimization

**Tree Shaking**:
- Import only used components
- Use ES6 imports

**Bundle Analysis**:
```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Errors

**Symptom**: `Error connecting to database`

**Solutions**:
```bash
# Check environment variables
echo $DATABASE_URL

# Test connection
pnpm prisma studio

# Regenerate Prisma client
pnpm prisma generate

# Reset database (WARNING: deletes data)
pnpm prisma migrate reset
```

#### 2. Authentication Issues

**Symptom**: `Redirected to /login despite being logged in`

**Solutions**:
- Check JWT_SECRET is set
- Verify cookie is being set (inspect browser cookies)
- Check token expiration
- Clear browser cookies and re-login

#### 3. Payment Webhook Not Working

**Symptom**: Purchase stuck in "pending" status

**Solutions**:
- Verify webhook URL in Xendit dashboard
- Check webhook secret matches
- Inspect Xendit webhook logs
- Test webhook with Xendit webhook tester

#### 4. File Upload Failing

**Symptom**: `Upload failed` error

**Solutions**:
- Check Cloudinary credentials
- Verify file size within limits
- Check file type is supported
- Inspect browser console for errors

#### 5. Build Failures (Vercel)

**Symptom**: Deployment fails

**Solutions**:
```bash
# Test build locally
pnpm build

# Check TypeScript errors
pnpm tsc --noEmit

# Verify environment variables in Vercel dashboard
# Check build logs in Vercel
```

---

## Conclusion

Dotload is a comprehensive, production-ready digital marketplace platform built with modern technologies and best practices. This documentation covers all major aspects of the system architecture, from database design to deployment strategies.

### Key Takeaways

1. **Modular Architecture**: Clean separation of concerns with layered architecture
2. **Type Safety**: Full TypeScript implementation with Prisma ORM
3. **Scalable Infrastructure**: Serverless deployment on Vercel with Supabase database
4. **Secure by Design**: JWT authentication, HTTP-only cookies, input validation
5. **Payment Integration**: Multi-method payment support via Xendit
6. **Comprehensive Testing**: Unit, integration, and E2E tests
7. **Developer Experience**: Well-organized codebase, clear conventions, extensive documentation

### Future Enhancements

- [ ] Subscription-based products
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] Affiliate program
- [ ] Mobile app (React Native)
- [ ] Admin panel
- [ ] Customer reviews and ratings
- [ ] AI-powered recommendations

---

**For questions or support, contact**: Glenn Santos
**Repository**: https://github.com/glennsantos/dotload
**Production URL**: https://dotload-friends-projects-5a78b24f.vercel.app
