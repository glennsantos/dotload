/**
 * ============================================================================
 * INTEGRATION TESTS - PRODUCT LIFECYCLE
 * ============================================================================
 *
 * Tests the complete product lifecycle:
 * 1. User creates product (draft)
 * 2. Upload product files
 * 3. Add product details
 * 4. Publish product
 * 5. Update product
 * 6. Archive product
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Declare global helper
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Prisma
const mockPrisma = {
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  file: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Cloudinary
const mockCloudinary = {
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
};

jest.mock('cloudinary', () => mockCloudinary);

// Mock auth
const mockAuth = {
  verifyAuth: jest.fn(),
};

jest.mock('@/lib/auth', () => mockAuth);

describe('Product Lifecycle Integration Tests', () => {
  let userId: string;
  let productId: string;
  let fileId: string;

  beforeEach(() => {
    jest.clearAllMocks();

    userId = 'user_lifecycle_123';
    productId = 'product_lifecycle_123';
    fileId = 'file_lifecycle_123';

    // Set up authenticated user
    mockAuth.verifyAuth.mockResolvedValue({
      userId,
      email: 'creator@example.com',
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'creator@example.com',
      name: 'Test Creator',
      emailVerified: true,
    });

    mockCloudinary.v2.uploader.upload.mockResolvedValue({
      public_id: 'test_product_file',
      secure_url: 'https://res.cloudinary.com/test/upload/product.pdf',
      bytes: 2048000,
      format: 'pdf',
    });

    mockPrisma.product.create.mockResolvedValue({
      id: productId,
      userId,
      name: 'My New E-book',
      slug: 'my-new-ebook',
      description: 'A comprehensive guide',
      price: 299,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPrisma.file.create.mockResolvedValue({
      id: fileId,
      productId,
      fileName: 'ebook.pdf',
      url: 'https://res.cloudinary.com/test/upload/product.pdf',
      cloudinaryPublicId: 'test_product_file',
      fileSize: 2048000,
    });
  });

  it('should complete full product creation lifecycle', async () => {
    // STEP 1: Create draft product
    console.log('Step 1: Create draft product');
    const { POST: createProduct } = await import('@/app/api/products/route');

    const createRequest = createMockNextRequest(
      'http://localhost:2222/api/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'My New E-book',
          description: 'A comprehensive guide to testing',
          price: 299,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const createResponse = await createProduct(createRequest);
    const createData = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createData.product.name).toBe('My New E-book');
    expect(createData.product.published).toBe(false);
    expect(createData.product.slug).toBeDefined();

    // STEP 2: Upload product file
    console.log('Step 2: Upload product file');
    const { POST: uploadFile } = await import('@/app/api/products/[id]/files/route');

    const uploadRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}/files`,
      {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'ebook.pdf',
          fileData: 'base64_encoded_file_data',
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const uploadResponse = await uploadFile(uploadRequest, {
      params: { id: productId },
    });
    const uploadData = await uploadResponse.json();

    expect(uploadResponse.status).toBe(200);
    expect(uploadData.file.fileName).toBe('ebook.pdf');
    expect(uploadData.file.url).toContain('cloudinary.com');

    // STEP 3: Update product details
    console.log('Step 3: Update product details');
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId,
      name: 'My New E-book',
      published: false,
    });

    mockPrisma.product.update.mockResolvedValue({
      id: productId,
      userId,
      name: 'My Updated E-book',
      description: 'An even better guide',
      price: 399,
      published: false,
    });

    const { PATCH: updateProduct } = await import('@/app/api/products/[id]/route');

    const updateRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'My Updated E-book',
          description: 'An even better guide',
          price: 399,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const updateResponse = await updateProduct(updateRequest, {
      params: { id: productId },
    });
    const updateData = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateData.product.name).toBe('My Updated E-book');
    expect(updateData.product.price).toBe(399);

    // STEP 4: Publish product
    console.log('Step 4: Publish product');
    mockPrisma.file.findMany.mockResolvedValue([
      {
        id: fileId,
        productId,
        fileName: 'ebook.pdf',
      },
    ]);

    mockPrisma.product.update.mockResolvedValue({
      id: productId,
      userId,
      name: 'My Updated E-book',
      published: true,
      publishedAt: new Date(),
    });

    const publishRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          published: true,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const publishResponse = await updateProduct(publishRequest, {
      params: { id: productId },
    });
    const publishData = await publishResponse.json();

    expect(publishResponse.status).toBe(200);
    expect(publishData.product.published).toBe(true);

    // STEP 5: Verify published product is publicly visible
    console.log('Step 5: Verify public visibility');
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      slug: 'my-updated-ebook',
      published: true,
      name: 'My Updated E-book',
    });

    const { GET: getPublicProduct } = await import('@/app/api/products/public/[slug]/route');

    const publicRequest = createMockNextRequest(
      'http://localhost:2222/api/products/public/my-updated-ebook',
      {
        method: 'GET',
      }
    );

    const publicResponse = await getPublicProduct(publicRequest, {
      params: { slug: 'my-updated-ebook' },
    });
    const publicData = await publicResponse.json();

    expect(publicResponse.status).toBe(200);
    expect(publicData.product.name).toBe('My Updated E-book');

    console.log('✓ Complete product lifecycle test passed!');
  });

  it('should prevent publishing product without files', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId,
      published: false,
    });

    mockPrisma.file.findMany.mockResolvedValue([]); // No files

    const { PATCH: updateProduct } = await import('@/app/api/products/[id]/route');

    const publishRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          published: true,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const publishResponse = await updateProduct(publishRequest, {
      params: { id: productId },
    });
    const publishData = await publishResponse.json();

    expect(publishResponse.status).toBe(400);
    expect(publishData.error).toContain('at least one file');

    console.log('✓ Publish validation test passed!');
  });

  it('should handle product archival', async () => {
    // Set up published product
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId,
      published: true,
      archived: false,
    });

    mockPrisma.product.update.mockResolvedValue({
      id: productId,
      userId,
      published: false,
      archived: true,
      archivedAt: new Date(),
    });

    const { PATCH: updateProduct } = await import('@/app/api/products/[id]/route');

    const archiveRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          archived: true,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const archiveResponse = await updateProduct(archiveRequest, {
      params: { id: productId },
    });
    const archiveData = await archiveResponse.json();

    expect(archiveResponse.status).toBe(200);
    expect(archiveData.product.archived).toBe(true);
    expect(archiveData.product.published).toBe(false);

    console.log('✓ Product archival test passed!');
  });

  it('should handle file deletion', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId,
      published: false,
    });

    mockPrisma.file.findUnique.mockResolvedValue({
      id: fileId,
      productId,
      cloudinaryPublicId: 'test_file_to_delete',
    });

    mockCloudinary.v2.uploader.destroy.mockResolvedValue({
      result: 'ok',
    });

    const { DELETE: deleteFile } = await import('@/app/api/products/[id]/files/[fileId]/route');

    const deleteRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const deleteResponse = await deleteFile(deleteRequest, {
      params: { id: productId, fileId },
    });

    expect(deleteResponse.status).toBe(204);
    expect(mockCloudinary.v2.uploader.destroy).toHaveBeenCalledWith('test_file_to_delete');
    expect(mockPrisma.file.delete).toHaveBeenCalledWith({
      where: { id: fileId },
    });

    console.log('✓ File deletion test passed!');
  });

  it('should prevent deleting files from published product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId,
      published: true, // Product is published
    });

    const { DELETE: deleteFile } = await import('@/app/api/products/[id]/files/[fileId]/route');

    const deleteRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const deleteResponse = await deleteFile(deleteRequest, {
      params: { id: productId, fileId },
    });
    const deleteData = await deleteResponse.json();

    expect(deleteResponse.status).toBe(400);
    expect(deleteData.error).toContain('published');

    console.log('✓ Published product file protection test passed!');
  });

  it('should generate unique slugs for products', async () => {
    // Create first product
    mockPrisma.product.create.mockResolvedValueOnce({
      id: 'product1',
      slug: 'my-ebook',
    });

    // Create second product with same name
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'product1',
      slug: 'my-ebook',
    }); // Slug already exists

    mockPrisma.product.create.mockResolvedValueOnce({
      id: 'product2',
      slug: 'my-ebook-2', // Incremented slug
    });

    const { POST: createProduct } = await import('@/app/api/products/route');

    const request2 = createMockNextRequest(
      'http://localhost:2222/api/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'My E-book',
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const response2 = await createProduct(request2);
    const data2 = await response2.json();

    expect(data2.product.slug).not.toBe('my-ebook');
    expect(data2.product.slug).toMatch(/my-ebook-\d+/);

    console.log('✓ Unique slug generation test passed!');
  });

  it('should validate product ownership for updates', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      userId: 'different_user', // Different owner
    });

    const { PATCH: updateProduct } = await import('@/app/api/products/[id]/route');

    const updateRequest = createMockNextRequest(
      `http://localhost:2222/api/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Unauthorized Update',
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      }
    );

    const updateResponse = await updateProduct(updateRequest, {
      params: { id: productId },
    });
    const updateData = await updateResponse.json();

    expect(updateResponse.status).toBe(403);
    expect(updateData.error).toContain('not authorized');

    console.log('✓ Product ownership validation test passed!');
  });
});
