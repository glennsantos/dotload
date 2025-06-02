# Changelog

All notable changes to the Alacarte e-commerce platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-30

### Added
- **Product-Specific Discount Code Creation**: Users can now create discount codes for specific products directly from the dashboard
  - Enhanced promos dashboard to support product selection when creating discount codes
  - Added "Manage in Dashboard" button in product edit page that links directly to the promos page with the product pre-selected
  - Automatic dialog opening when navigating from a product page to create discount codes
  - Full integration between product management and discount code creation workflows

### Fixed
- **Discount Code Handling**: Fixed discount code validation and calculation issues in checkout
  - Resolved NaN display issue when showing discount amounts
  - Added backward compatibility for both old (`amount`, `startDate`, `endDate`) and new (`value`, `expiresAt`) field formats
  - Improved error handling for invalid discount values
  - Enhanced discount code validation to check for active status, usage limits, and expiration dates
  - Fixed type conversion issues in price calculations
  - Added proper error messages for various discount code validation scenarios:
    - Invalid discount codes
    - Expired discount codes  
    - Inactive discount codes
    - Usage limit exceeded
    - Invalid discount values

### Technical Changes
- Updated `Discount` interface in `types.ts` to support both legacy and new field formats
- Enhanced `calculateFinalPrice` function to handle both `value` and `amount` fields
- Improved `validateDiscountCode` function with comprehensive validation logic
- Added `hasDiscountCodes` utility function to check for available discount codes
- Updated CheckoutForm and OrderSummary components to display correct discount information
- Enhanced CheckoutForm to conditionally show discount field based on product availability
- Added comprehensive test suite for discount validation and calculation
- Added UI behavior tests for conditional discount field rendering (5 tests)
- Enhanced promos dashboard with product fetching and selection capabilities
- Added product query parameter handling for pre-selecting products when creating discount codes

### Files Modified
- `app/p/[slug]/checkout/components/types.ts`
- `app/p/[slug]/checkout/components/utils.ts`
- `app/p/[slug]/checkout/components/CheckoutForm.tsx`
- `app/p/[slug]/checkout/components/OrderSummary.tsx`
- `app/p/[slug]/checkout/components/index.ts`
- `app/p/[slug]/checkout/page.tsx`
- `app/dashboard/promos/page.tsx`
- `app/products/[id]/edit/page.tsx`
- `tests/frontend/discount-validation.test.ts` (updated)
- `tests/frontend/checkout-ui.test.tsx` (new)

### Improved
- **Checkout UX Enhancement**: Discount code field is now hidden when products have no discount codes available
  - Added `hasDiscountCodes()` utility function to check if products have available discount codes
  - Improved checkout form layout by conditionally showing discount field only when relevant
  - Enhanced user experience by reducing unnecessary form fields 
- **Dashboard UX Enhancement**: Pre-selection of products when creating discount codes from product management pages

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

## Template for Future Releases

### Added
- New features and functionality

### Changed  
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements 