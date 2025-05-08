import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAuthUserId } from '@/lib/auth-utils';
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
  const contentFiles = formData.getAll('contentFiles') as File[];
  
  const processedFiles = [];
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
  
  // Process content files
  for (const file of contentFiles) {
    try {
      // Upload to Cloudinary
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder = `users/${userId}/products/${productId}/content`;
      
      const result = await uploadToCloudinary(buffer, {
        folder,
        public_id: `${file.name.split('.')[0]}-${Date.now()}`,
      }) as any;
      
      processedFiles.push({
        filename: file.name,
        path: result.secure_url,
        mimetype: file.type
      });
    } catch (error) {
      console.error('Content file upload error:', error);
      // Fallback to local storage if Cloudinary fails
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `file-${uniqueSuffix}-${file.name}`;
      const path = join(uploadsDir, filename);
      
      await writeFile(path, new Uint8Array(await file.arrayBuffer()));
      
      processedFiles.push({
        filename: file.name,
        path: `uploads/${filename}`,
        mimetype: file.type
      });
    }
  }
  
  return { coverImagePath, processedFiles };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to create a product'
      }, { status: 401 });
    }
    
    // Extract basic product details
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const price = formData.get('price') as string;
    const description = formData.get('description') as string || '';
    const slug = formData.get('slug') as string || '';
    
    // Validate required fields
    if (!name || !type || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: {
          name: !!name,
          type: !!type,
          price: !!price
        }
      }, { status: 400 });
    }
    
    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ 
        error: 'Invalid price', 
        details: 'Price must be a non-negative number' 
      }, { status: 400 });
    }
    
    // Additional price validation - ensure it's not empty or zero
    if (parsedPrice === 0) {
      return NextResponse.json({ 
        error: 'Invalid price', 
        details: 'Price must be greater than zero' 
      }, { status: 400 });
    }
    
    // Parse variations
    let parsedVariations: Array<{ name: string; options: string }> = [];
    try {
      const variations = formData.get('variations');
      if (variations) {
        const variationsData = JSON.parse(variations as string);
        if (Array.isArray(variationsData)) {
          parsedVariations = variationsData.map(v => ({
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
    
    // Create a temporary product ID for file organization
    const tempProductId = Date.now().toString();
    
    // Process uploaded files
    const { coverImagePath, processedFiles } = await processFiles(formData, userId, tempProductId);
    
    // Parse content links if exist
    let contentLinks: string[] = [];
    try {
      const contentLinksData = formData.get('contentLinks');
      if (contentLinksData) {
        contentLinks = JSON.parse(contentLinksData as string);
      }
    } catch (error) {
      console.error('Error parsing content links:', error);
      // Continue with empty array
    }
    
    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        type,
        price: parsedPrice,
        currency: 'PHP', // Set default currency to Philippine Pesos
        description,
        ...(slug ? { slug } : {}),
        coverImagePath,
        userId, // Use the found or created user ID
        ...paymentOptions,
        ...(parsedVariations.length > 0 ? { 
          variations: {
            create: parsedVariations
          }
        } : {}),
        files: {
          create: [
            ...processedFiles,
            ...contentLinks.map((link: string) => ({
              filename: link.split('/').pop() || 'external-link',
              path: link,
              mimetype: 'text/url'
            }))
          ]
        }
      },
      include: {
        variations: true,
        files: true
      }
    });
    
    return NextResponse.json({
      message: 'Product created successfully',
      product,
      fileCount: processedFiles.length,
      variationCount: parsedVariations.length
    }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view your products'
      }, { status: 401 });
    }

    // Find products for the current user
    const products = await prisma.product.findMany({
      where: {
        userId: userId
      },
      include: {
        files: true,
        variations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
