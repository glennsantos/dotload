import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAuthUserId } from '@/lib/auth-utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateUniqueSlug } from '@/lib/slug-utils';

// Function removed - using Cloudinary exclusively

// Process uploaded files - using Cloudinary exclusively
async function processFiles(formData: FormData, userId: string, productId: string) {
  const coverImage = formData.get('coverImage') as File | null;
  const contentFiles = formData.getAll('contentFiles') as File[];
  
  const processedFiles = [];
  let coverImagePath = null;
  
  // Process cover image if exists
  if (coverImage) {
    // Upload to Cloudinary
    const arrayBuffer = await coverImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = `users/${userId}/products/${productId}/cover`;
    
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: `cover-${Date.now()}`,
    }) as any;
    
    coverImagePath = result.secure_url;
  }
  
  // Process content files
  for (const file of contentFiles) {
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
  }
  
  return { coverImagePath, processedFiles };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the current authenticated user's ID
    console.log('Getting auth user ID...');
    const userId = await getAuthUserId();
    console.log('Auth user ID:', userId);
    
    // Get the token from cookies for debugging
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    console.log('Token cookie present:', !!tokenCookie);
    
    // If no authenticated user, return error
    if (!userId) {
      console.log('No user ID found - authentication required');
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
    const visibility = formData.get('visibility') as string;
    const status = formData.get('status') as string;
    
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
    
    // Generate a unique slug if not provided
    const productSlug = slug || await generateUniqueSlug(name);
    
    // Create product data object
    console.log('Creating product data object with:', {
      userId,
      name,
      type,
      price: parsedPrice,
      hasDescription: !!description,
      hasCoverImage: !!coverImagePath,
      contentFiles: processedFiles.length,
      contentLinks: contentLinks.length
    });
    
    // Remove userId from productData since we'll add it explicitly in create
    const productData: any = {
      name,
      type,
      price: parsedPrice,
      currency: 'PHP', // Set default currency to Philippine Pesos
      description,
      coverImagePath,
      userId,
      allowPayWhatYouWant: paymentOptions.allowPayWhatYouWant,
      offerCoupons: paymentOptions.offerCoupons,
    };
    
    // Add slug if provided
    if (productSlug) {
      productData.slug = productSlug;
    }
    
    // Add visibility and status if provided
    if (visibility) {
      productData.isPublic = visibility === 'public';
    }
    
    if (status) {
      productData.status = status;
    }
    
    // Create product with relations
    console.log('Creating product with data:', {
      ...productData,
      userId,
      variations: parsedVariations.length > 0 ? 'present' : 'none',
      files: processedFiles.length + contentLinks.length
    });
    
    const product = await prisma.product.create({
      data: {
        ...productData,
        userId, // Explicitly include userId here
        variations: parsedVariations.length > 0 ? {
          create: parsedVariations
        } : undefined,
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
