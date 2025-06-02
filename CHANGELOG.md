# Changelog

All notable changes to the Alacarte e-commerce platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2024-12-19

### Added - Frontend Testing Implementation
- **Complete Frontend Test Suite**: Implemented comprehensive frontend tests covering user registration, settings updates, and product editing
  - **Registration Tests** (`tests/frontend/auth/registration.test.tsx`): 13 tests covering form rendering, email validation, password confirmation, terms agreement, successful registration, existing email errors, network errors, and loading states
  - **Settings Tests** (`tests/frontend/settings/settings.test.tsx`): 16 tests with tab navigation between profile and password management, including form rendering, field validation, username format rules, successful updates, duplicate username handling, password requirements, length validation, confirmation matching, and different from current password validation
  - **Product Edit Tests** (`tests/frontend/products/product-edit.test.tsx`): 17 tests covering comprehensive product editing functionality including form rendering with existing data, validation of required fields, successful updates, error handling, image management (file uploads, removing existing/new images), product deletion with confirmation dialog, navigation, loading states, and product type switching

### Added - Backend Testing Implementation
- **Products API Tests** (`tests/backend/products/products.test.ts`): ✅ **7/7 tests passing**
  - Successful product creation (digital and physical products)
  - Authentication validation
  - Required field validation
  - Price validation
  - Product listing with authentication
  - Unique slug generation
  - Comprehensive error handling

### Improved - Backend Testing Infrastructure
- **Established Working Mock Pattern**: Developed a successful approach for backend API testing by directly mocking request methods (`formData()`, `text()`, `json()`) instead of complex FormData handling
- **Authentication Mocking**: Implemented proper JWT token verification mocking and authentication utility mocking
- **TypeScript Compatibility**: Resolved ESM/CommonJS compatibility issues and TypeScript linter errors with Jest mocking
- **Test Environment Configuration**: Updated test scripts and journey runner for proper test execution

### In Progress - Backend Testing
- **Purchases API Tests** (`tests/backend/purchases/purchases.test.ts`): 🔄 **3/12 tests passing**
  - Successfully implemented authentication rejection and error handling tests
  - Identified API structure differences (JWT token verification vs getAuthUserId utility)
  - Established working pattern for request mocking with `text()` method
  
- **Payouts API Tests** (`tests/backend/payouts/payouts.test.ts`): 🔄 **3/17 tests passing**
  - Successfully implemented authentication rejection and fee configuration tests
  - Identified authentication flow differences with `getCurrentUser()` utility
  - Applied working mock pattern for request handling

### Technical Achievements
- **Mock Strategy Breakthrough**: Solved complex FormData mocking issues by implementing direct request method mocking (`request.formData()`, `request.text()`, `request.json()`)
- **Authentication Testing**: Successfully implemented JWT token verification mocking with proper error handling
- **Test Infrastructure**: Updated `package.json` scripts, `tests/run-frontend-journey.js`, and test configuration for comprehensive test execution
- **Documentation**: Updated `tasks.md` with detailed Frontend Testing section documenting all implemented tests

### Test Results Summary
- **Frontend Tests**: ✅ **46/46 tests passing** (100% success rate)
  - Registration: 13/13 ✅
  - Settings: 16/16 ✅  
  - Product Edit: 17/17 ✅
- **Backend Tests**: 🔄 **13/36 tests passing** (36% success rate, with clear path forward)
  - Products: 7/7 ✅ (100% success rate)
  - Purchases: 3/12 🔄 (25% success rate, working pattern established)
  - Payouts: 3/17 🔄 (18% success rate, working pattern established)

### Next Steps Identified
- Apply established working mock pattern to remaining purchases and payouts tests
- Implement proper authentication utility mocking for `getCurrentUser()` and JWT verification
- Complete backend test coverage using the proven direct request mocking approach

## [Previous Versions]

### Core Platform Features
- Next.js 15 with TypeScript implementation
- PostgreSQL database with Prisma ORM
- JWT-based authentication system
- Xendit payment gateway integration
- Cloudinary file storage
- Product management (digital and physical)
- Purchase and order fulfillment system
- Seller payout functionality
- Dashboard analytics
- Email notification system

### Infrastructure
- AWS deployment configuration
- Docker containerization
- SSL/TLS security implementation
- Database migration system
- Environment configuration management

## [1.0.1] - 2025-06-01

### Fixed
- **Nginx File Upload Size Limit**: Fixed `413 Request Entity Too Large` error when uploading files larger than 1MB by setting `client_max_body_size 100M` in nginx configuration files. This allows file uploads up to 100MB to pass through nginx to the application, while application-level validation still enforces specific limits (50MB for content files, 10MB for cover images).

## [1.0.0] - 2025-06-01

### Added
- Initial release of alaCarte digital marketplace platform
- User authentication and registration system
- Product creation and management for digital and physical products
- File upload system with Cloudinary integration
- Payment processing with Xendit integration
- Email notifications with AWS SES
- Responsive web interface built with Next.js and Tailwind CSS
- PostgreSQL database with Prisma ORM
- Docker containerization support
- AWS deployment configuration 