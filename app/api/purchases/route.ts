import { NextRequest, NextResponse } from 'next/server';
import { createPurchase } from '@/lib/purchase-utils';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabasePurchaseService } from '@/lib/supabase-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env');

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as { userId: string, email: string };

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || undefined;
    const includeFiles = searchParams.get('includeFiles') === 'true';

    // Build options for Supabase query
    const options = {
      limit,
      offset,
      status,
      includeFiles
    };

    // Get total count for pagination
    const totalCount = await supabasePurchaseService.countPurchasesByEmail(decoded.email, status);

    // Get user's purchases with pagination using Supabase
    const purchases = await supabasePurchaseService.getPurchasesByEmail(decoded.email, options);
    
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
      if (error.name === 'JWTInvalid' || error.name === 'JWTExpired') {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logPurchaseStep('VALIDATION_FAILED_EMAIL_FORMAT');
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      }, { status: 400 });
    }
    
    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      logPurchaseStep('VALIDATION_FAILED_AMOUNT_INVALID', { amount, type: typeof amount });
      return NextResponse.json({ 
        error: 'Invalid amount',
        details: 'Amount must be a positive number'
      }, { status: 400 });
    }
    
    logPurchaseStep('VALIDATION_COMPLETED_CALLING_CREATE_PURCHASE');
    
    // Use the centralized purchase creation utility
    // This handles product validation, access code generation, etc.
    const result = await createPurchase({
      productId,
      email,
      mobileNumber: mobileNumber || '',
      amount,
      currency,
      paymentMethod
    });
    
    logPurchaseStep('PURCHASE_CREATION_COMPLETED', {
      resultKeys: Object.keys(result),
      purchaseId: result.id,
      hasAccessCode: !!result.accessCode
    });
    
    return NextResponse.json({
      purchase: result
    }, { status: 201 });
    
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    logPurchaseStep('PURCHASE_CREATION_ERROR', errorInfo, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Product not found
      if (error.message.includes('Product not found') || error.message.includes('Failed to find product')) {
        return NextResponse.json({
          error: 'Product not found',
          details: 'The specified product does not exist'
        }, { status: 404 });
      }
      
      // Invalid product state
      if (error.message.includes('not available') || error.message.includes('not active')) {
        return NextResponse.json({
          error: 'Product not available',
          details: 'This product is currently not available for purchase'
        }, { status: 400 });
      }
      
      // Discount code errors
      if (error.message.includes('discount') || error.message.includes('coupon')) {
        return NextResponse.json({
          error: 'Invalid discount code',
          details: error.message
        }, { status: 400 });
      }
      
      // Database errors
      if (error.message.includes('Failed to create purchase') || error.message.includes('Database')) {
        return NextResponse.json({
          error: 'Database error',
          details: 'Could not create purchase. Please try again.'
        }, { status: 500 });
      }
      
      // Default error response
      return NextResponse.json({
        error: 'Purchase creation failed',
        details: error.message
      }, { status: 500 });
    }
    
    // Fallback for unknown errors
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred during purchase creation'
    }, { status: 500 });
  }
}
