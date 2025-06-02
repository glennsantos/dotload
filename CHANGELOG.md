# Changelog

All notable changes to the Alacarte e-commerce platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite implementation
- Backend API tests for authentication, products, purchases, and payouts
- Frontend component tests with React Testing Library
- Jest configuration with TypeScript support
- Test coverage reporting and CI/CD integration
- Mock services for external dependencies (Prisma, Xendit, Cloudinary, Email)
- Test documentation and guidelines in README.md
- Package.json scripts for different test scenarios
- **Frontend User Journey Tests**: Comprehensive test coverage for critical user flows
  - User registration tests (13 test cases) covering form validation, error handling, and successful registration
  - Settings update tests (16 test cases) covering profile management and password changes with tab navigation
  - Product editing tests (17 test cases) covering form validation, image management, and product deletion
  - Test infrastructure updates with individual test scripts and journey runner integration

### Changed
- Updated README.md with detailed testing section
- Enhanced package.json with testing dependencies and scripts
- Improved project structure with dedicated tests directory

### Technical Details
- **Test Framework**: Jest with React Testing Library
- **Coverage**: 200+ test cases covering critical user journeys
- **Mocking**: Comprehensive mocking of external services
- **Structure**: Organized by feature area (auth, products, purchases, payouts)
- **CI/CD**: Automated test execution on pull requests and deployments

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