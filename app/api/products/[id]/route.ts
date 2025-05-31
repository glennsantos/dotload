import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile, unlink, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import * as fs from 'fs';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { apiConfig, checkFileSizeLimit, formatFileSize } from '../../config';

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

// Process uploaded files
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
        
        // Create file record in database
        const fileRecord = await prisma.file.create({
          data: {
            filename: file.name,
            path: relativePath,
            mimetype: file.type,
            productId: productId
          }
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
      
      // Log form data keys and values for debugging
      console.log('Edit Product - Form Data Keys:', [...formData.keys()]);
      
      // Log the raw form data values for key fields
      console.log('Edit Product - Raw Form Data:');
      console.log('- badges:', formData.get('badges'));
      console.log('- trustIndicators:', formData.get('trustIndicators'));
      console.log('- whatsIncluded:', formData.get('whatsIncluded'));
      console.log('- curriculum:', formData.get('curriculum'));
      
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
      let secureCheckout = false;
      let instantDownload = false;
      let refundPolicy = false;
      let customTrustIndicators = '[]';
      
      try {
        const trustIndicatorsData = formData.get('trustIndicators');
        if (trustIndicatorsData) {
          const parsedTrustIndicators = JSON.parse(trustIndicatorsData as string);
          secureCheckout = !!parsedTrustIndicators.secureCheckout;
          instantDownload = !!parsedTrustIndicators.instantDownload;
          refundPolicy = !!parsedTrustIndicators.refundPolicy;
          customTrustIndicators = JSON.stringify(parsedTrustIndicators.custom || []);
        } else {
          console.log('Edit Product - No trust indicators data found in form, preserving existing data');
          // Preserve existing trust indicators data if not provided in form
          secureCheckout = existingProduct.secureCheckout || false;
          instantDownload = existingProduct.instantDownload || false;
          refundPolicy = existingProduct.refundPolicy || false;
          
          try {
            if (existingProduct.customTrustIndicators) {
              customTrustIndicators = existingProduct.customTrustIndicators;
              console.log('Edit Product - Using existing customTrustIndicators data:', customTrustIndicators);
            }
          } catch (error) {
            console.error('Error using existing customTrustIndicators:', error);
          }
        }
      } catch (parseError) {
        console.error('Error parsing trust indicators:', parseError);
        // Continue with default values
      }
      
      // Parse badges
      let bestSeller = false;
      let newRelease = false;
      let popular = false;
      let customBadges = '[]';
      
      try {
        const badgesData = formData.get('badges');
        if (badgesData) {
          const parsedBadges = JSON.parse(badgesData as string);
          bestSeller = !!parsedBadges.bestSeller;
          newRelease = !!parsedBadges.newRelease;
          popular = !!parsedBadges.popular;
          customBadges = JSON.stringify(Array.isArray(parsedBadges.custom) ? parsedBadges.custom : []);
        } else {
          console.log('Edit Product - No badges data found in form, preserving existing data');
          // Preserve existing badges data if not provided in form
          bestSeller = existingProduct.bestSeller || false;
          newRelease = existingProduct.newRelease || false;
          popular = existingProduct.popular || false;
          
          try {
            if (existingProduct.customBadges) {
              customBadges = existingProduct.customBadges;
              console.log('Edit Product - Using existing customBadges data:', customBadges);
            }
          } catch (error) {
            console.error('Error using existing customBadges:', error);
          }
        }
      } catch (parseError) {
        console.error('Error parsing badges:', parseError);
        // Continue with default values
      }
      
      // Get the slug from form data
      const slug = formData.get('slug') as string || '';
      
      // Parse what's included
      let whatsIncluded = [];
      
      try {
        const whatsIncludedData = formData.get('whatsIncluded');
        console.log('Edit Product - Processing whatsIncluded:', whatsIncludedData);
        if (whatsIncludedData) {
          whatsIncluded = JSON.parse(whatsIncludedData as string);
          console.log('Edit Product - Parsed whatsIncluded:', whatsIncluded);
          if (!Array.isArray(whatsIncluded)) {
            console.log('Edit Product - whatsIncluded is not an array, resetting to empty array');
            whatsIncluded = [];
          }
        } else {
          console.log('Edit Product - No whatsIncluded data found in form, preserving existing data');
          // Preserve existing whatsIncluded data if not provided in form
          try {
            const existingWhatsIncluded = existingProduct.whatsIncluded;
            if (existingWhatsIncluded) {
              whatsIncluded = JSON.parse(existingWhatsIncluded);
              console.log('Edit Product - Using existing whatsIncluded data:', whatsIncluded);
            }
          } catch (error) {
            console.error('Error parsing existing whatsIncluded:', error);
          }
        }
      } catch (parseError) {
        console.error('Error parsing whatsIncluded:', parseError);
        // Continue with empty array
      }
      
      // Parse curriculum items
      let curriculum = [];
      try {
        const curriculumData = formData.get('curriculum');
        console.log('Edit Product - Processing curriculum:', curriculumData);
        if (curriculumData) {
          curriculum = JSON.parse(curriculumData as string);
          console.log('Edit Product - Parsed curriculum:', curriculum);
          if (!Array.isArray(curriculum)) {
            console.log('Edit Product - curriculum is not an array, resetting to empty array');
            curriculum = [];
          }
        } else {
          console.log('Edit Product - No curriculum data found in form, preserving existing data');
          // Preserve existing curriculum data if not provided in form
          try {
            const existingCurriculum = existingProduct.curriculum;
            if (existingCurriculum) {
              curriculum = JSON.parse(existingCurriculum);
              console.log('Edit Product - Using existing curriculum data:', curriculum);
            }
          } catch (error) {
            console.error('Error parsing existing curriculum:', error);
          }
        }
      } catch (parseError) {
        console.error('Error parsing curriculum:', parseError);
        // Continue with empty array
      }
      
      // Parse download settings
      let downloadSettings = {
        downloadLimit: 5,
        linkExpiration: 30
      };
      
      try {
        const downloadSettingsData = formData.get('downloadSettings');
        if (downloadSettingsData) {
          const parsedSettings = JSON.parse(downloadSettingsData as string);
          downloadSettings = {
            downloadLimit: parseInt(parsedSettings.downloadLimit) || 5,
            linkExpiration: parseInt(parsedSettings.linkExpiration) || 30
          };
        }
      } catch (parseError) {
        console.error('Error parsing download settings:', parseError);
        // Continue with default values
      }
      
      // Log the data before creating the updateData object
      console.log('Edit Product - Data for updateData:', {
        whatsIncluded,
        curriculum,
        bestSeller,
        newRelease,
        popular,
        customBadges
      });
      
      updateData = {
        name,
        description: description || undefined, // Only update if not blank
        price: parsedPrice,
        // Add payment options as individual fields
        allowPayWhatYouWant: paymentOptions.allowPayWhatYouWant,
        offerCoupons: paymentOptions.offerCoupons,
        ...(coverImagePath ? { coverImagePath } : {}),
        // Add slug if provided
        ...(slug ? { slug } : {}),
        // Add trust indicators as individual fields
        secureCheckout: secureCheckout,
        instantDownload: instantDownload,
        refundPolicy: refundPolicy,
        customTrustIndicators: customTrustIndicators,
        // Add badges as individual fields
        bestSeller: bestSeller,
        newRelease: newRelease,
        popular: popular,
        customBadges: customBadges,
        // Always include whatsIncluded and curriculum, even if empty
        whatsIncluded: JSON.stringify(whatsIncluded || []),
        curriculum: JSON.stringify(curriculum || []),
        // Add download settings as individual fields
        downloadLimit: downloadSettings.downloadLimit,
        linkExpiration: downloadSettings.linkExpiration
      };
      
      console.log('Edit Product - Final updateData:', updateData);
      
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
    
    // Log the final updateData object
    console.log('Edit Product - Final updateData:', updateData);
    
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
