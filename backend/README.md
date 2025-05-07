# alaCarte Backend

## Prerequisites
- Node.js 22.x
- pnpm

## Setup
1. Install dependencies
```bash
pnpm install
```

2. Generate Prisma Client
```bash
pnpm prisma:generate
```

3. Initialize Database
```bash
pnpm prisma:migrate
```

## Running the Server
- Development: `pnpm dev`
- Production: `pnpm start`

## API Endpoints
- `POST /api/products`: Create a new product
- `GET /api/products`: List all products
- `GET /api/products/:id`: Get a specific product

## File Upload
Files are stored in the `uploads/` directory and can be accessed via `/uploads/{filename}`
