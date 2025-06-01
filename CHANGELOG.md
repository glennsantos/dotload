# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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