import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = join(cwd(), 'uploads');
  try {
    await mkdir(uploadsDir, { recursive: true });
    return uploadsDir;
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    throw error;
  }
}

// Process uploaded files
async function processFiles(formData: FormData, userId: string, productId: string) {
  const uploadsDir = await ensureUploadsDir();
  const coverImage = formData.get('coverImage') as File | null;
  
  let coverImagePath = null;
  
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
  
  return { coverImagePath };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
      },
      include: {
        files: true,
        variations: true
      }
    });
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to view this product'
      }, { status: 403 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Fetch product error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
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
      const { coverImagePath: newCoverImagePath } = await processFiles(formData, userId, params.id);
      if (newCoverImagePath) {
        coverImagePath = newCoverImagePath;
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
      
      updateData = {
        name,
        description,
        price: parsedPrice,
        ...paymentOptions,
        ...(coverImagePath ? { coverImagePath } : {})
      };
      
      // Handle variations update if provided
      if (parsedVariations.length > 0) {
        // Delete existing variations and create new ones
        await prisma.variation.deleteMany({
          where: {
            productId: params.id
          }
        });
        
        // Create new variations
        await Promise.all(parsedVariations.map(variation => 
          prisma.variation.create({
            data: {
              ...variation,
              productId: params.id
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
        ...(jsonData.allowPayWhatYouWant !== undefined ? { allowPayWhatYouWant: !!jsonData.allowPayWhatYouWant } : {}),
        ...(jsonData.offerCoupons !== undefined ? { offerCoupons: !!jsonData.offerCoupons } : {})
      };
      
      // Handle variations update if provided
      if (jsonData.variations && Array.isArray(jsonData.variations)) {
        // Delete existing variations and create new ones
        await prisma.variation.deleteMany({
          where: {
            productId: params.id
          }
        });
        
        // Create new variations
        await Promise.all(jsonData.variations.map((variation: any) => 
          prisma.variation.create({
            data: {
              name: variation.name || 'Unnamed Variation',
              options: JSON.stringify(variation.options || []),
              productId: params.id
            }
          })
        ));
      }
    }
    
    // Update product in database
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        variations: true,
        files: true
      }
    });
    
    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
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
        productId: params.id
      }
    });
    
    await prisma.variation.deleteMany({
      where: {
        productId: params.id
      }
    });
    
    // Delete the product
    await prisma.product.delete({
      where: {
        id: params.id
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
