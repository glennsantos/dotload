import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile, unlink, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import * as fs from 'fs';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { apiConfig, checkFileSizeLimit, formatFileSize } from '../../config';
import { isAllowedDigitalFile } from '@/lib/file-validation';
import { supabaseProductService, supabaseFileService, supabaseVariationService } from '@/lib/supabase-db';

// Ensure uploads directory exists with proper structure
async function ensureUploadsDir(userId: string, productId: string) {
  // Create the base uploads directory
  const baseUploadsDir = join(cwd(), 'uploads');
  console.log(`Base uploads directory: ${baseUploadsDir}`);
  
  // Create the user-specific directory structure
  const userProductDir = join(baseUploadsDir, 'users', userId, 'products', productId);
  console.log(`Target product directory: ${userProductDir}`);
  
  try {
    // First ensure the base uploads directory exists
    try {
      await mkdir(baseUploadsDir, { recursive: false });
      console.log(`Created base uploads directory: ${baseUploadsDir}`);
    } catch (error) {
      // Directory may already exist, which is fine
      console.log(`Base uploads directory already exists or error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Now create the nested structure
    try {
      await mkdir(userProductDir, { recursive: true });
      console.log(`Successfully created product directory: ${userProductDir}`);
    } catch (dirError) {
      console.error(`Failed to create directory structure: ${dirError instanceof Error ? dirError.message : String(dirError)}`);
      throw dirError;
    }
    
    // Verify the directory exists and is writable
    try {
      const testFile = join(userProductDir, '.test-write-access');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      console.log(`Product directory is writable: ${userProductDir}`);
    } catch (writeError) {
      console.error(`Product directory exists but is not writable: ${userProductDir}`, 
        writeError instanceof Error ? writeError.message : String(writeError));
      throw new Error(`Directory exists but is not writable: ${userProductDir}`);
    }
    
    return userProductDir;
  } catch (error: unknown) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    console.error('Error ensuring product directory:', typedError);
    throw typedError;
  }
}

// Process uploaded files using Supabase
async function processFiles(formData: FormData, userId: string, productId: string) {
  const productDir = await ensureUploadsDir(userId, productId);
  const coverImage = formData.get('coverImage') as File | null;
  const contentFiles: File[] = [];
  const MAX_FILE_SIZE_MB = 50; // 50MB file size limit
  
  // Extract content files from formData and validate size
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('contentFile') && value instanceof File) {
      // Check file size
      if (!checkFileSizeLimit(value, MAX_FILE_SIZE_MB)) {
        throw new Error(`File ${value.name} exceeds the maximum size limit of ${MAX_FILE_SIZE_MB}MB. File size: ${formatFileSize(value.size)}`);
      }
      
      // Check file type
      if (!isAllowedDigitalFile(value.name, value.type)) {
        throw new Error(`File ${value.name} is not an allowed file type. Please upload only supported file formats.`);
      }
      
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
      console.log(`Uploaded cover image to Cloudinary: ${coverImagePath}`);
    } catch (error) {
      console.error('Cover image upload error:', error);
      console.log('Falling back to local storage for cover image');
      
      // Fallback to local storage if Cloudinary fails
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `coverImage-${uniqueSuffix}-${coverImage.name}`;
        const filePath = join(productDir, filename);
        
        console.log(`Saving cover image to: ${filePath}`);
        
        // Save file to disk
        const fileBuffer = new Uint8Array(await coverImage.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        console.log(`Successfully wrote cover image: ${filePath} (${fileBuffer.length} bytes)`);
        
        // Verify file was written
        const stats = await stat(filePath);
        console.log(`Cover image verified: ${filePath}, size: ${stats.size} bytes`);
        
        // Set the path for database storage
        coverImagePath = `uploads/users/${userId}/products/${productId}/${filename}`;
        console.log(`Cover image path for database: ${coverImagePath}`);
      } catch (fileError) {
        console.error('Failed to save cover image locally:', fileError);
        throw fileError;
      }
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
        const filePath = join(productDir, filename);
        
        console.log(`Saving file to: ${filePath}`);
        
        try {
          // Save file to disk
          const fileBuffer = new Uint8Array(await file.arrayBuffer());
          await writeFile(filePath, fileBuffer);
          console.log(`Successfully wrote file: ${filePath} (${fileBuffer.length} bytes)`);
          
          // Verify file was written
          const stats = await stat(filePath);
          console.log(`File verified: ${filePath}, size: ${stats.size} bytes`);
        } catch (writeError) {
          console.error(`Failed to write file to disk: ${filePath}`, writeError);
          throw writeError;
        }
        
        // Create the relative path for storage in the database
        const relativePath = `uploads/users/${userId}/products/${productId}/${filename}`;
        console.log(`Database path: ${relativePath}`);
        
        // Create file record in database using Supabase
        const fileRecord = await supabaseFileService.createFile({
          filename: file.name,
          path: relativePath,
          mimetype: file.type,
          productId: productId
        });
        
        console.log(`Created database record for file: ${file.name}, id: ${fileRecord.id}`);
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
    
    // Find the product by ID using Supabase
    const product = await supabaseProductService.findProductById(productId);
    
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
    
    // Get variations for this product using Supabase
    const variations = await supabaseVariationService.getVariationsByProductId(productId);
    
    // Get files for this product using Supabase
    const files = await supabaseFileService.getFilesByProductId(productId);
    
    // Return the product data
    return NextResponse.json({
      product: {
        ...product,
        variations,
        files
      }
    });
  } catch (error) {
    console.error('Product fetch error:', error);
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
        details: 'You must be logged in to edit a product'
      }, { status: 401 });
    }
    
    // Find the product by ID using Supabase
    const existingProduct = await supabaseProductService.findProductById(productId);
    
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
        details: 'You do not have permission to edit this product'
      }, { status: 403 });
    }

    // Parse request data
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with files
      const formData = await request.formData();
      
      console.log('Edit Product - Processing form data');
      
      // Extract text fields
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const price = formData.get('price') as string;
      const type = formData.get('type') as string;
      const allowPayWhatYouWant = formData.get('allowPayWhatYouWant') as string;
      const offerCoupons = formData.get('offerCoupons') as string;
      const discountCodes = formData.get('discountCodes') as string;
      const isPublic = formData.get('isPublic') as string;
      const status = formData.get('status') as string;
      const variations = formData.get('variations') as string;
      
      // Build update data object only with provided fields
      updateData = {
        ...(name !== null && name !== undefined ? { name } : {}),
        ...(description !== null && description !== undefined ? { description } : {}),
        ...(price !== null && price !== undefined ? { 
          price: parseFloat(price) || 0 
        } : {}),
        ...(type !== null && type !== undefined ? { type } : {}),
        ...(allowPayWhatYouWant !== null && allowPayWhatYouWant !== undefined ? { 
          allowPayWhatYouWant: allowPayWhatYouWant === 'true' 
        } : {}),
        ...(offerCoupons !== null && offerCoupons !== undefined ? { 
          offerCoupons: offerCoupons === 'true' 
        } : {}),
        ...(discountCodes !== null && discountCodes !== undefined ? { discountCodes } : {}),
        ...(isPublic !== null && isPublic !== undefined ? { 
          isPublic: isPublic === 'true' 
        } : {}),
        ...(status !== null && status !== undefined ? { status } : {})
      };
      
      console.log('Edit Product - Extracted data:', updateData);
      
      // Process files if any are present
      const { coverImagePath, uploadedContentFiles } = await processFiles(formData, userId, productId);
      
      // Add cover image to update data if provided
      if (coverImagePath) {
        updateData.coverImage = coverImagePath;
      }
      
      console.log('Edit Product - Files processed:', { 
        coverImagePath, 
        uploadedFilesCount: uploadedContentFiles.length 
      });
      
      // Handle variations update if provided
      if (variations) {
        try {
          const parsedVariations = JSON.parse(variations);
          
          // Delete existing variations and create new ones using Supabase
          await supabaseVariationService.deleteVariationsByProductId(productId);
          
          // Create new variations using Supabase
          await Promise.all(parsedVariations.map(variation => 
            supabaseVariationService.createVariation({
              name: variation.name || 'Unnamed Variation',
              options: JSON.stringify(variation.options || []),
              productId: productId
            })
          ));
        } catch (error) {
          console.error('Error processing variations:', error);
        }
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
        if (isNaN(parsedPrice)) {
          return NextResponse.json({ 
            error: 'Invalid price', 
            details: 'Price must be a valid number'
          }, { status: 400 });
        }

        // Check if it's an integer
        if (!Number.isInteger(parsedPrice)) {
          return NextResponse.json({ 
            error: 'Invalid price', 
            details: 'Price must be a whole number (no decimals)' 
          }, { status: 400 });
        }

        // Check range: must be between 1 and 500000
        if (parsedPrice < 1) {
          return NextResponse.json({ 
            error: 'Invalid price', 
            details: 'Price must be at least ₱1' 
          }, { status: 400 });
        }

        if (parsedPrice > 500000) {
          return NextResponse.json({ 
            error: 'Invalid price', 
            details: 'Price cannot exceed ₱500,000' 
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
        // Delete existing variations and create new ones using Supabase
        await supabaseVariationService.deleteVariationsByProductId(productId);
        
        // Create new variations using Supabase
        await Promise.all(jsonData.variations.map((variation: any) => 
          supabaseVariationService.createVariation({
            name: variation.name || 'Unnamed Variation',
            options: JSON.stringify(variation.options || []),
            productId: productId
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
    
    // Log the final updateData object
    console.log('Edit Product - Final updateData:', updateData);
    
    // Update the product with the provided data using Supabase
    const updatedProduct = await supabaseProductService.updateProduct(productId, updateData);
    
    // Fetch the updated product with all its data using Supabase
    const refreshedProduct = await supabaseProductService.findProductById(productId);
    const variations = await supabaseVariationService.getVariationsByProductId(productId);
    
    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: {
        ...refreshedProduct,
        variations
      }
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
    
    // Find the product by ID using Supabase
    const existingProduct = await supabaseProductService.findProductById(productId);
    
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
    
    // Delete associated files and variations using Supabase
    await supabaseFileService.deleteFilesByProductId(productId);
    await supabaseVariationService.deleteVariationsByProductId(productId);
    
    // Delete the product using Supabase
    await supabaseProductService.deleteProduct(productId);
    
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
