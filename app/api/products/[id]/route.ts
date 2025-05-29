import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = join(cwd(), 'uploads');
  try {
    await mkdir(uploadsDir, { recursive: true });
    console.log(`Successfully ensured uploads directory exists: ${uploadsDir}`);
    
    // Verify the directory exists and is writable
    try {
      const testFile = join(uploadsDir, '.test-write-access');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      console.log('Uploads directory is writable');
    } catch (writeError) {
      console.error('Uploads directory exists but is not writable:', writeError instanceof Error ? writeError.message : String(writeError));
      // We'll continue anyway, but log the warning
    }
    
    return uploadsDir;
  } catch (error: unknown) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    console.error('Error creating uploads directory:', typedError);
    throw typedError;
  }
}

// Process uploaded files
async function processFiles(formData: FormData, userId: string, productId: string) {
  const uploadsDir = await ensureUploadsDir();
  const coverImage = formData.get('coverImage') as File | null;
  const contentFiles: File[] = [];
  
  // Extract content files from formData
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('contentFile') && value instanceof File) {
      contentFiles.push(value);
    }
  }
  
  let coverImagePath = null;
  const uploadedContentFiles = [];
  
  // Process cover image if exists
  if (coverImage) {
    try {
      // Upload to Cloudinary
      const arrayBuffer = await coverImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder = `users/${userId}/products/${productId}/cover`;
      
      const result = await uploadToCloudinary(buffer, {
        folder,
        public_id: `cover-${Date.now()}`,
      }) as any;
      
      coverImagePath = result.secure_url;
    } catch (error) {
      console.error('Cover image upload error:', error);
      // Fallback to local storage if Cloudinary fails
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `coverImage-${uniqueSuffix}-${coverImage.name}`;
      const path = join(uploadsDir, filename);
      
      await writeFile(path, new Uint8Array(await coverImage.arrayBuffer()));
      coverImagePath = `uploads/${filename}`;
    }
  }
  
  // Process content files if any
  if (contentFiles.length > 0) {
    console.log(`Processing ${contentFiles.length} content files`);
    
    for (const file of contentFiles) {
      try {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}-${file.name}`;
        const filePath = join(uploadsDir, filename);
        
        // Save file to disk
        await writeFile(filePath, new Uint8Array(await file.arrayBuffer()));
        
        // Create file record in database
        const fileRecord = await prisma.file.create({
          data: {
            filename: file.name,
            path: `uploads/${filename}`,
            mimetype: file.type,
            productId: productId
          }
        });
        
        uploadedContentFiles.push(fileRecord);
      } catch (error) {
        console.error(`Error processing content file ${file.name}:`, error);
      }
    }
  }
  
  return { coverImagePath, uploadedContentFiles };
}

export async function GET(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view product details'
      }, { status: 401 });
    }

    // Find the product by ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        files: true,
        variations: true
      }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Process string fields that should be JSON objects
    const processedProduct = {
      ...product,
      contentLinks: product.contentLinks ? JSON.parse(product.contentLinks) : [],
      whatsIncluded: product.whatsIncluded ? JSON.parse(product.whatsIncluded) : [],
      curriculum: product.curriculum ? JSON.parse(product.curriculum) : [],
      badges: {
        bestSeller: product.bestSeller || false,
        newRelease: product.newRelease || false,
        popular: product.popular || false,
        custom: product.customBadges ? JSON.parse(product.customBadges) : []
      },
      trustIndicators: {
        secureCheckout: product.secureCheckout || true,
        instantDownload: product.instantDownload || true,
        refundPolicy: product.refundPolicy || false,
        custom: product.customTrustIndicators ? JSON.parse(product.customTrustIndicators) : []
      },
      downloadSettings: {
        downloadLimit: product.downloadLimit || 5,
        linkExpiration: product.linkExpiration || 30
      },
      paymentOptions: {
        allowPayWhatYouWant: product.allowPayWhatYouWant || false,
        offerCoupons: product.offerCoupons || false
      },
      inventorySettings: {
        allowPreOrders: product.allowPreOrders || false
      }
    };
    
    // Check if user has permission to view this product
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to view this product'
      }, { status: 403 });
    }
    
    // Return the processed product with all data properly formatted
    return NextResponse.json(processedProduct);
  } catch (error) {
    console.error('Fetch product error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to update a product'
      }, { status: 401 });
    }
    
    // Find the product by ID
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    });
    
    // Check if product exists and belongs to the user
    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (existingProduct.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to update this product'
      }, { status: 403 });
    }
    
    // Check if the request is multipart/form-data or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};
    let coverImagePath = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      
      // Extract basic product details
      const name = formData.get('name') as string;
      const description = formData.get('description') as string || '';
      const price = formData.get('price') as string;
      
      // Validate required fields
      if (!name || !price) {
        return NextResponse.json({ 
          error: 'Missing required fields',
          details: {
            name: !!name,
            price: !!price,
          }
        }, { status: 400 });
      }
      
      // Parse price
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ 
          error: 'Invalid price', 
          details: 'Price must be a positive number'
        }, { status: 400 });
      }
      
      // Process uploaded files if any
      const { coverImagePath: newCoverImagePath, uploadedContentFiles } = await processFiles(formData, userId, productId);
      if (newCoverImagePath) {
        coverImagePath = newCoverImagePath;
      }
      
      // Log the uploaded content files
      if (uploadedContentFiles && uploadedContentFiles.length > 0) {
        console.log(`Successfully uploaded ${uploadedContentFiles.length} content files`);
      }
      
      // Parse variations if exist
      let parsedVariations: { name: string; options: string }[] = [];
      try {
        const variationsData = formData.get('variations');
        if (variationsData) {
          const parsed = JSON.parse(variationsData as string);
          if (Array.isArray(parsed)) {
            parsedVariations = parsed.map(v => ({
              name: v.name || 'Unnamed Variation',
              options: JSON.stringify(v.options || [])
            }));
          }
        }
      } catch (parseError) {
        console.error('Error parsing variations:', parseError);
        return NextResponse.json({ 
          error: 'Invalid variations format', 
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        }, { status: 400 });
      }
      
      // Parse payment options
      let paymentOptions = {
        allowPayWhatYouWant: false,
        offerCoupons: false
      };
      
      try {
        const paymentOptionsData = formData.get('paymentOptions');
        if (paymentOptionsData) {
          const parsedOptions = JSON.parse(paymentOptionsData as string);
          paymentOptions = {
            allowPayWhatYouWant: !!parsedOptions.allowPayWhatYouWant,
            offerCoupons: !!parsedOptions.offerCoupons
          };
        }
      } catch (parseError) {
        console.error('Error parsing payment options:', parseError);
        // Continue with default values
      }
      
      // Parse trust indicators
      let trustIndicators = {
        secureCheckout: true,
        instantDownload: true,
        refundPolicy: false,
        customTrustIndicators: '[]'
      };
      
      try {
        const trustIndicatorsData = formData.get('trustIndicators');
        if (trustIndicatorsData) {
          const parsedTrustIndicators = JSON.parse(trustIndicatorsData as string);
          trustIndicators = {
            secureCheckout: !!parsedTrustIndicators.secureCheckout,
            instantDownload: !!parsedTrustIndicators.instantDownload,
            refundPolicy: !!parsedTrustIndicators.refundPolicy,
            customTrustIndicators: JSON.stringify(parsedTrustIndicators.custom || [])
          };
        }
      } catch (parseError) {
        console.error('Error parsing trust indicators:', parseError);
        // Continue with default values
      }
      
      // Parse badges
      let badges = {
        bestSeller: false,
        newRelease: false,
        popular: false,
        customBadges: '[]'
      };
      
      try {
        const badgesData = formData.get('badges');
        if (badgesData) {
          const parsedBadges = JSON.parse(badgesData as string);
          badges = {
            bestSeller: !!parsedBadges.bestSeller,
            newRelease: !!parsedBadges.newRelease,
            popular: !!parsedBadges.popular,
            customBadges: JSON.stringify(parsedBadges.custom || [])
          };
        }
      } catch (parseError) {
        console.error('Error parsing badges:', parseError);
        // Continue with default values
      }
      
      updateData = {
        name,
        description,
        price: parsedPrice,
        ...paymentOptions,
        ...(coverImagePath ? { coverImagePath } : {}),
        // Add trust indicators
        secureCheckout: trustIndicators.secureCheckout,
        instantDownload: trustIndicators.instantDownload,
        refundPolicy: trustIndicators.refundPolicy,
        customTrustIndicators: trustIndicators.customTrustIndicators,
        // Add badges
        bestSeller: badges.bestSeller,
        newRelease: badges.newRelease,
        popular: badges.popular,
        customBadges: badges.customBadges
      };
      
      // Handle variations update if provided
      if (parsedVariations.length > 0) {
        // Delete existing variations and create new ones
        await prisma.variation.deleteMany({
          where: {
            productId: productId
          }
        });
        
        // Create new variations
        await Promise.all(parsedVariations.map(variation => 
          prisma.variation.create({
            data: {
              ...variation,
              productId: productId
            }
          })
        ));
      }
    } else {
      // Handle JSON data
      const jsonData = await request.json();
      
      // Validate required fields
      if (!jsonData.name) {
        return NextResponse.json({ 
          error: 'Missing required fields',
          details: 'Product name is required'
        }, { status: 400 });
      }
      
      // Parse price if provided
      if (jsonData.price !== undefined) {
        const parsedPrice = parseFloat(jsonData.price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return NextResponse.json({ 
            error: 'Invalid price', 
            details: 'Price must be a positive number'
          }, { status: 400 });
        }
        jsonData.price = parsedPrice;
      }
      
      updateData = {
        ...(jsonData.name !== undefined ? { name: jsonData.name } : {}),
        ...(jsonData.description !== undefined ? { description: jsonData.description } : {}),
        ...(jsonData.price !== undefined ? { price: jsonData.price } : {}),
        ...(jsonData.type !== undefined ? { type: jsonData.type } : {}),
        ...(jsonData.allowPayWhatYouWant !== undefined ? { allowPayWhatYouWant: !!jsonData.allowPayWhatYouWant } : {}),
        ...(jsonData.offerCoupons !== undefined ? { offerCoupons: !!jsonData.offerCoupons } : {}),
        ...(jsonData.discountCodes !== undefined ? { discountCodes: jsonData.discountCodes } : {}),
        ...(jsonData.isPublic !== undefined ? { isPublic: !!jsonData.isPublic } : {}),
        ...(jsonData.status !== undefined ? { status: jsonData.status } : {})
      };
      
      // Handle variations update if provided
      if (jsonData.variations && Array.isArray(jsonData.variations)) {
        // Delete existing variations and create new ones
        await prisma.variation.deleteMany({
          where: {
            productId: productId
          }
        });
        
        // Create new variations
        await Promise.all(jsonData.variations.map((variation: any) => 
          prisma.variation.create({
            data: {
              name: variation.name || 'Unnamed Variation',
              options: JSON.stringify(variation.options || []),
              productId: productId
            }
          })
        ));
      }
    }
    
    // Validate discount codes if provided
    if (updateData.discountCodes) {
      try {
        // Parse the discount codes to ensure they're valid JSON
        const parsedCodes = JSON.parse(updateData.discountCodes);
        
        // Validate each discount code
        if (Array.isArray(parsedCodes)) {
          for (const code of parsedCodes) {
            if (!code.code || !code.amount) {
              return NextResponse.json({ 
                error: 'Invalid discount code', 
                details: 'Each discount code must have a code and amount'
              }, { status: 400 });
            }
          }
        } else {
          return NextResponse.json({ 
            error: 'Invalid discount codes format', 
            details: 'Discount codes must be an array'
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid discount codes format', 
          details: 'Failed to parse discount codes JSON'
        }, { status: 400 });
      }
    }
    
    // Update the product with the provided data
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: updateData
    });
    
    // Fetch the updated product with all its data
    const refreshedProduct = await prisma.product.findUnique({
      where: {
        id: productId
      },
      include: {
        variations: true
      }
    });
    
    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: refreshedProduct
    });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to delete a product'
      }, { status: 401 });
    }
    
    // Find the product by ID
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    });
    
    // Check if product exists and belongs to the user
    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (existingProduct.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to delete this product'
      }, { status: 403 });
    }
    
    // Delete associated files and variations
    await prisma.file.deleteMany({
      where: {
        productId: productId
      }
    });
    
    await prisma.variation.deleteMany({
      where: {
        productId: productId
      }
    });
    
    // Delete the product
    await prisma.product.delete({
      where: {
        id: productId
      }
    });
    
    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
