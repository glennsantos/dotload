import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateUniqueSlug } from '@/lib/slug-utils';
import { apiConfig, checkFileSizeLimit, formatFileSize } from '../config';
import { supabaseProductService, supabaseVariationService } from '@/lib/supabase-db';

// Function removed - using Cloudinary exclusively

// Process uploaded files - cover image only, content files handled separately
async function processFiles(formData: FormData, userId: string, productId: string) {
  const coverImage = formData.get('coverImage') as File | null;
  
  console.log(`Processing files for product ${productId}:`);
  console.log(`- Cover image: ${coverImage ? coverImage.name : 'None'}`);
  
  let coverImagePath = null;
  
  // Process cover image if exists - using Cloudinary
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
    console.log(`Cover image uploaded to Cloudinary: ${coverImagePath}`);
  }
  
  // Content files are now handled separately via the /api/products/[id]/files endpoint
  // which uses the local uploads folder
  
  return { coverImagePath, processedFiles: [] };
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
    const currency = formData.get('currency') as string || 'PHP';
    
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
    
    // Validate name length
    if (name.length > 100) {
      return NextResponse.json({
        error: 'Invalid product name',
        details: 'Product name must be less than 100 characters'
      }, { status: 400 });
    }
    
    // Validate price
    const parsedPrice = parseFloat(price);
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
    
    // Validate slug if provided
    if (slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json({
          error: 'Invalid slug',
          details: 'Slug must contain only lowercase letters, numbers, and hyphens'
        }, { status: 400 });
      }
    }
    
    // Validate description length if provided
    if (description && description.length > 5000) {
      return NextResponse.json({
        error: 'Invalid description',
        details: 'Description must be less than 5000 characters'
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
    
    // Parse download settings
    let downloadSettings = {
      downloadLimit: 5, // Default value
      linkExpiration: 30 // Default value
    };
    try {
      const downloadSettingsData = formData.get('downloadSettings');
      if (downloadSettingsData) {
        downloadSettings = JSON.parse(downloadSettingsData as string);
        
        // Validate download settings
        if (downloadSettings.downloadLimit < 1 || downloadSettings.downloadLimit > 100) {
          return NextResponse.json({
            error: 'Invalid download limit',
            details: 'Download limit must be between 1 and 100'
          }, { status: 400 });
        }
        
        if (downloadSettings.linkExpiration < 1 || downloadSettings.linkExpiration > 365) {
          return NextResponse.json({
            error: 'Invalid link expiration',
            details: 'Link expiration must be between 1 and 365 days'
          }, { status: 400 });
        }
      }
    } catch (parseError) {
      console.error('Error parsing download settings:', parseError);
      // Continue with default values
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!slug) {
      finalSlug = await generateUniqueSlug(name);
    } else {
      // Check if slug already exists
      const slugExists = await supabaseProductService.slugExists(slug);
      if (slugExists) {
        return NextResponse.json({
          error: 'Slug already exists',
          details: 'Please choose a different slug'
        }, { status: 409 });
      }
    }

    // Generate unique id for the product
    const crypto = await import('crypto');
    const productId = crypto.randomUUID();

    // Process cover image first
    const { coverImagePath } = await processFiles(formData, userId, productId);

    // Create product using Supabase
    console.log('Creating product with Supabase...');
    const product = await supabaseProductService.createProduct({
      id: productId,
      name,
      type,
      price: parsedPrice,
      description,
      userId,
      coverImagePath,
      slug: finalSlug,
      allowPayWhatYouWant: paymentOptions.allowPayWhatYouWant,
      offerCoupons: paymentOptions.offerCoupons,
      downloadLimit: downloadSettings.downloadLimit,
      linkExpiration: downloadSettings.linkExpiration,
      currency,
      isPublic: visibility === 'public',
      status: status || 'draft'
    });

    console.log('Product created successfully:', product.id);

    // Create variations using Supabase
    if (parsedVariations.length > 0) {
      console.log(`Creating ${parsedVariations.length} variations...`);
      
      for (const variation of parsedVariations) {
        await supabaseVariationService.createVariation({
          name: variation.name,
          options: variation.options,
          productId: product.id
        });
      }
      
      console.log('Variations created successfully');
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        price: product.price,
        description: product.description,
        coverImagePath: product.coverImagePath,
        slug: product.slug,
        allowPayWhatYouWant: product.allowPayWhatYouWant,
        offerCoupons: product.offerCoupons,
        currency: product.currency,
        downloadLimit: product.downloadLimit,
        linkExpiration: product.linkExpiration,
        isPublic: product.isPublic,
        status: product.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      // Handle Supabase-specific errors
      if (error.message.includes('Failed to create product')) {
        return NextResponse.json({
          error: 'Database error',
          details: 'Could not create product in database'
        }, { status: 500 });
      }
      
      // Handle file upload errors
      if (error.message.includes('upload')) {
        return NextResponse.json({
          error: 'File upload error',
          details: 'Could not upload cover image'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        error: 'Product creation failed',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view products'
      }, { status: 401 });
    }

    // Get products using Supabase
    const products = await supabaseProductService.getProductsByUserId(userId, true);

    console.log(`[PRODUCTS-API] Found ${products.length} products for user ${userId}`);

    // Transform the data to match the expected format
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      type: product.type,
      price: product.price,
      description: product.description,
      coverImagePath: product.coverImagePath,
      digitalItemPath: product.digitalItemPath,
      slug: product.slug,
      currency: product.currency,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      status: product.status,
      isPublic: product.isPublic,
      allowPayWhatYouWant: product.allowPayWhatYouWant,
      offerCoupons: product.offerCoupons,
      downloadLimit: product.downloadLimit,
      linkExpiration: product.linkExpiration,
      files: product.files || [],
      variations: product.variations || []
    }));

    return NextResponse.json({
      products: transformedProducts
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Failed to fetch products',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
