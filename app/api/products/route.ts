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
import { apiConfig, checkFileSizeLimit, formatFileSize } from '../config';

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
        if (type === 'digital_product') {
          // Validate download limit
          if (downloadSettings.downloadLimit !== undefined) {
            const downloadLimit = parseInt(downloadSettings.downloadLimit.toString());
            if (isNaN(downloadLimit) || downloadLimit < 1) {
              return NextResponse.json({
                error: 'Invalid download limit',
                details: 'Download limit must be a positive number'
              }, { status: 400 });
            }
          }
          
          // Validate link expiration
          if (downloadSettings.linkExpiration !== undefined) {
            const linkExpiration = parseInt(downloadSettings.linkExpiration.toString());
            if (isNaN(linkExpiration) || linkExpiration < 1) {
              return NextResponse.json({
                error: 'Invalid link expiration',
                details: 'Link expiration must be a positive number'
              }, { status: 400 });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing download settings:', error);
      // Use default values if parsing fails
      // Continue with default values
    }
    
    // Parse badges
    let badges = {
      bestSeller: false,
      newRelease: false,
      popular: false,
      custom: []
    };
    
    try {
      const badgesData = formData.get('badges');
      if (badgesData) {
        badges = JSON.parse(badgesData as string);
        
        // Validate custom badges
        if (badges.custom && Array.isArray(badges.custom)) {
          for (const badge of badges.custom) {
            if (typeof badge !== 'string') {
              return NextResponse.json({
                error: 'Invalid custom badge',
                details: 'Custom badges must be strings'
              }, { status: 400 });
            }
            
            const badgeStr = badge as string;
            if (!badgeStr.trim()) {
              return NextResponse.json({
                error: 'Invalid custom badge',
                details: 'Custom badge cannot be empty'
              }, { status: 400 });
            }
            
            if (badgeStr.length > 50) {
              return NextResponse.json({
                error: 'Invalid custom badge',
                details: 'Custom badge must be less than 50 characters'
              }, { status: 400 });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing badges:', parseError);
      // Continue with default values
    }
    
    // Parse trust indicators
    let trustIndicators = {
      secureCheckout: true,
      instantDownload: true,
      refundPolicy: false,
      custom: []
    };
    
    try {
      const trustIndicatorsData = formData.get('trustIndicators');
      if (trustIndicatorsData) {
        trustIndicators = JSON.parse(trustIndicatorsData as string);
        
        // Validate custom trust indicators
        if (trustIndicators.custom && Array.isArray(trustIndicators.custom)) {
          for (const indicator of trustIndicators.custom) {
            if (typeof indicator !== 'string') {
              return NextResponse.json({
                error: 'Invalid custom trust indicator',
                details: 'Custom trust indicators must be strings'
              }, { status: 400 });
            }
            
            const indicatorStr = indicator as string;
            if (!indicatorStr.trim()) {
              return NextResponse.json({
                error: 'Invalid custom trust indicator',
                details: 'Custom trust indicator cannot be empty'
              }, { status: 400 });
            }
            
            if (indicatorStr.length > 50) {
              return NextResponse.json({
                error: 'Invalid custom trust indicator',
                details: 'Custom trust indicator must be less than 50 characters'
              }, { status: 400 });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing trust indicators:', parseError);
      // Continue with default values
    }
    
    // Parse what's included
    let whatsIncluded = [];
    
    try {
      const whatsIncludedData = formData.get('whatsIncluded');
      console.log('Create Product - Processing whatsIncluded:', whatsIncludedData);
      if (whatsIncludedData) {
        whatsIncluded = JSON.parse(whatsIncludedData as string);
        console.log('Create Product - Parsed whatsIncluded:', whatsIncluded);
        
        // Validate what's included items
        if (Array.isArray(whatsIncluded)) {
          for (let i = 0; i < whatsIncluded.length; i++) {
            const item = whatsIncluded[i];
            
            if (typeof item !== 'string') {
              return NextResponse.json({
                error: 'Invalid what\'s included item',
                details: 'What\'s included items must be strings'
              }, { status: 400 });
            }
            
            const itemStr = item as string;
            if (!itemStr.trim()) {
              return NextResponse.json({
                error: 'Invalid what\'s included item',
                details: 'What\'s included item cannot be empty'
              }, { status: 400 });
            }
            
            if (itemStr.length > 100) {
              return NextResponse.json({
                error: 'Invalid what\'s included item',
                details: 'What\'s included item must be less than 100 characters'
              }, { status: 400 });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing what\'s included:', parseError);
      // Continue with default values
    }
    
    // Parse curriculum
    let curriculum = [];
    
    try {
      const curriculumData = formData.get('curriculum');
      console.log('Create Product - Processing curriculum:', curriculumData);
      if (curriculumData) {
        curriculum = JSON.parse(curriculumData as string);
        console.log('Create Product - Parsed curriculum:', curriculum);
        
        // Validate curriculum items
        if (Array.isArray(curriculum)) {
          for (let i = 0; i < curriculum.length; i++) {
            const section = curriculum[i];
            
            // Check if section has the correct structure
            if (!section || typeof section !== 'object') {
              return NextResponse.json({
                error: 'Invalid curriculum section',
                details: 'Curriculum sections must be objects'
              }, { status: 400 });
            }
            
            // Check if section has title
            if (!section.title || typeof section.title !== 'string') {
              return NextResponse.json({
                error: 'Invalid curriculum section',
                details: 'Curriculum sections must have a title'
              }, { status: 400 });
            }
            
            // Check title length
            if (section.title.length > 100) {
              return NextResponse.json({
                error: 'Invalid curriculum section',
                details: 'Curriculum section title must be less than 100 characters'
              }, { status: 400 });
            }
            
            // Check if section has items array
            if (!Array.isArray(section.items)) {
              return NextResponse.json({
                error: 'Invalid curriculum section',
                details: 'Curriculum sections must have an items array'
              }, { status: 400 });
            }
            
            // Validate each item in the section
            for (let j = 0; j < section.items.length; j++) {
              const item = section.items[j];
              
              if (typeof item !== 'string') {
                return NextResponse.json({
                  error: 'Invalid curriculum item',
                  details: 'Curriculum items must be strings'
                }, { status: 400 });
              }
              
              if (!item.trim()) {
                return NextResponse.json({
                  error: 'Invalid curriculum item',
                  details: 'Curriculum item cannot be empty'
                }, { status: 400 });
              }
              
              if (item.length > 200) {
                return NextResponse.json({
                  error: 'Invalid curriculum item',
                  details: 'Curriculum item must be less than 200 characters'
                }, { status: 400 });
              }
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing curriculum:', parseError);
      // Continue with default values
    }
    
    // Parse inventory settings for physical products
    let stockQuantity = null;
    let allowPreOrders = false;
    
    try {
      const stockQuantityData = formData.get('stockQuantity');
      if (stockQuantityData && stockQuantityData !== 'null') {
        stockQuantity = parseInt(stockQuantityData as string, 10);
        
        // Validate stock quantity for physical products
        if (type === 'physical_product') {
          if (isNaN(stockQuantity) || stockQuantity < 0) {
            return NextResponse.json({
              error: 'Invalid stock quantity',
              details: 'Stock quantity must be a non-negative number'
            }, { status: 400 });
          }
        }
      }
      
      const allowPreOrdersData = formData.get('allowPreOrders');
      if (allowPreOrdersData) {
        allowPreOrders = allowPreOrdersData === 'true';
      }
      
      // Validate pre-order settings
      if (type === 'physical_product' && allowPreOrders && stockQuantity !== null && stockQuantity > 0) {
        return NextResponse.json({
          error: 'Invalid inventory configuration',
          details: 'Pre-orders should only be enabled when stock is zero or not specified'
        }, { status: 400 });
      }
    } catch (parseError) {
      console.error('Error parsing inventory settings:', parseError);
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
        
        // Validate content links for digital products
        if (type === 'digital_product' && Array.isArray(contentLinks)) {
          for (let i = 0; i < contentLinks.length; i++) {
            const link = contentLinks[i];
            
            if (typeof link !== 'string') {
              return NextResponse.json({
                error: 'Invalid content link',
                details: 'Content links must be strings'
              }, { status: 400 });
            }
            
            // Check if the link is a valid URL
            try {
              new URL(link);
            } catch (e) {
              return NextResponse.json({
                error: 'Invalid content link',
                details: `Link at position ${i + 1} is not a valid URL`
              }, { status: 400 });
            }
          }
        }
        
        // For digital products, validate that there are files or links
        if (type === 'digital_product' && 
            processedFiles.length === 0 && 
            contentLinks.length === 0) {
          return NextResponse.json({
            error: 'Missing content',
            details: 'Digital products require at least one content file or link'
          }, { status: 400 });
        }
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
      currency: currency, // Use the currency from form data
      description,
      coverImagePath,
      userId,
      
      // Payment options
      allowPayWhatYouWant: paymentOptions.allowPayWhatYouWant,
      offerCoupons: paymentOptions.offerCoupons,
      
      // Download settings for digital products
      downloadLimit: downloadSettings.downloadLimit,
      linkExpiration: downloadSettings.linkExpiration,
      
      // Product badges
      bestSeller: badges.bestSeller,
      newRelease: badges.newRelease,
      popular: badges.popular,
      customBadges: JSON.stringify(badges.custom),
      
      // Trust indicators
      secureCheckout: trustIndicators.secureCheckout,
      instantDownload: trustIndicators.instantDownload,
      refundPolicy: trustIndicators.refundPolicy,
      customTrustIndicators: JSON.stringify(trustIndicators.custom),
      
      // Physical product fields
      stockQuantity: stockQuantity,
      allowPreOrders: allowPreOrders,
      
      // Additional fields - ensure we always have valid JSON arrays even if empty
      whatsIncluded: JSON.stringify(whatsIncluded || []),
      curriculum: JSON.stringify(curriculum || []),
      contentLinks: JSON.stringify(contentLinks || []),
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
    console.log('Create Product - Final Data:', {
      whatsIncluded: productData.whatsIncluded,
      curriculum: productData.curriculum,
      customBadges: productData.customBadges,
      customTrustIndicators: productData.customTrustIndicators
    });
    
    const product = await prisma.product.create({
      data: {
        ...productData,
        userId, // Explicitly include userId here
        variations: parsedVariations.length > 0 ? {
          create: parsedVariations
        } : undefined,
        files: contentLinks.length > 0 ? {
          create: [
            ...contentLinks.map((link: string) => ({
              filename: link.split('/').pop() || 'external-link',
              path: link,
              mimetype: 'text/url'
            }))
          ]
        } : undefined
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
