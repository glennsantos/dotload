import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPurchase } from '@/lib/purchase-utils';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string };

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status') || undefined;
    const includeFiles = searchParams.get('includeFiles') === 'true';

    // Build the where clause
    const where: any = {
      email: decoded.email
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.purchase.count({ where });

    // Get user's purchases with pagination
    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            // Include files if requested
            ...(includeFiles ? {
              files: {
                select: {
                  id: true,
                  filename: true,
                  path: true,
                  mimetype: true
                }
              }
            } : {})
          }
        }
      },
      skip,
      take: limit
    });
    
    // Add debug logging
    console.log(`[PURCHASES-API] Fetched ${purchases.length} purchases with includeFiles=${includeFiles}`);
    if (includeFiles) {
      purchases.forEach((purchase: any) => {
        if (purchase.product?.files) {
          console.log(`[PURCHASES-API] Purchase ${purchase.id} has ${purchase.product.files.length} files`);
        }
      });
    }

    return NextResponse.json({
      purchases,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      // Handle specific database errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table does not exist. Please run migrations.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch purchase information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Enhanced logging utility for debugging
  const logPurchaseStep = (step: string, data?: any, error?: any) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[PurchasesAPI][${timestamp}]`;
    
    if (error) {
      console.error(`${logPrefix} ERROR in ${step}:`, error);
      if (data) console.error(`${logPrefix} Context data:`, data);
    } else {
      console.log(`${logPrefix} ${step}`, data ? data : '');
    }
  };

  try {
    logPurchaseStep('API_REQUEST_START', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Parse request body with error handling
    let body;
    try {
      const rawBody = await request.text();
      logPurchaseStep('RAW_REQUEST_BODY', { 
        length: rawBody.length,
        preview: rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : '')
      });
      
      body = JSON.parse(rawBody);
      logPurchaseStep('REQUEST_BODY_PARSED', {
        keys: Object.keys(body),
        productId: body.productId,
        email: body.email,
        amount: body.amount,
        currency: body.currency
      });
    } catch (parseError) {
      logPurchaseStep('REQUEST_BODY_PARSE_ERROR', {}, parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 400 });
    }

    const { 
      productId, 
      email, 
      mobileNumber,
      amount,
      currency = 'PHP',
      paymentMethod = 'pending',
      discountCode,
      discountAmount,
      selectedVariation
    } = body;
    
    logPurchaseStep('REQUEST_VALIDATION_START', {
      productId,
      email,
      mobileNumber,
      amount,
      currency,
      paymentMethod,
      hasDiscountCode: !!discountCode,
      hasSelectedVariation: !!selectedVariation
    });
    
    if (!productId || !email || !amount) {
      logPurchaseStep('VALIDATION_FAILED_MISSING_FIELDS', { 
        hasProductId: !!productId,
        hasEmail: !!email,
        hasAmount: !!amount
      });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Product ID, email, and amount are required'
      }, { status: 400 });
    }
    
    // Find the product
    logPurchaseStep('PRODUCT_LOOKUP_START', { productId });
    let product;
    try {
      product = await prisma.product.findUnique({
        where: { id: productId }
      });
      logPurchaseStep('PRODUCT_LOOKUP_SUCCESS', {
        productFound: !!product,
        productId: product?.id,
        productName: product?.name,
        productPrice: product?.price
      });
    } catch (dbError) {
      logPurchaseStep('PRODUCT_LOOKUP_ERROR', { productId }, dbError);
      return NextResponse.json({ 
        error: 'Database error while fetching product',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
    
    if (!product) {
      logPurchaseStep('PRODUCT_NOT_FOUND', { productId });
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Create a purchase record using the utility function
    logPurchaseStep('PURCHASE_CREATE_START', {
      productId,
      email,
      mobileNumber,
      amount,
      currency,
      paymentMethod
    });

    let purchase;
    try {
      purchase = await createPurchase({
        productId,
        email,
        mobileNumber: mobileNumber || '', // Make mobileNumber optional
        amount,
        currency,
        paymentMethod, // Use the payment method from the request
      });
      
      logPurchaseStep('PURCHASE_CREATE_SUCCESS', {
        purchaseId: purchase.id,
        accessCode: purchase.accessCode,
        status: purchase.status
      });
    } catch (createError) {
      logPurchaseStep('PURCHASE_CREATE_ERROR', {
        productId,
        email,
        amount,
        currency
      }, createError);
      
      return NextResponse.json({ 
        error: 'Failed to create purchase', 
        details: createError instanceof Error ? createError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    const responseData = {
      id: purchase.id,
      accessCode: purchase.accessCode,
      status: purchase.status,
      purchaseId: purchase.id // Add purchaseId for redirect
    };
    
    logPurchaseStep('API_RESPONSE_SUCCESS', responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    const logPurchaseStep = (step: string, data?: any, error?: any) => {
      const timestamp = new Date().toISOString();
      const logPrefix = `[PurchasesAPI][${timestamp}]`;
      
      if (error) {
        console.error(`${logPrefix} ERROR in ${step}:`, error);
        if (data) console.error(`${logPrefix} Context data:`, data);
      } else {
        console.log(`${logPrefix} ${step}`, data ? data : '');
      }
    };

    logPurchaseStep('API_REQUEST_ERROR', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    }, error);
    
    return NextResponse.json({ 
      error: 'Failed to create purchase', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
