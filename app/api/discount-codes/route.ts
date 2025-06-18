import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseProductService } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products with discount codes using Supabase
    const products = await supabaseProductService.getProductsWithDiscountCodes(user.id);
    
    // Parse discount codes from products
    const allDiscountCodes: any[] = [];
    
    products.forEach((product: any) => {
      if (!product.discountCodes) return;
      
      try {
        // Try to parse the discount codes JSON string
        const productCodes = JSON.parse(product.discountCodes);
        
        if (Array.isArray(productCodes)) {
          productCodes.forEach(code => {
            allDiscountCodes.push({
              ...code,
              productId: product.id,
              productName: product.name
            });
          });
        }
      } catch (error) {
        console.error(`Error parsing discount codes for product ${product.id}:`, error);
      }
    });

    return NextResponse.json(allDiscountCodes);
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.type || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, type, value' },
        { status: 400 }
      );
    }

    // Create a new discount code
    const newDiscountCode: any = {
      id: Date.now().toString(),
      code: body.code,
      type: body.type,
      value: body.value,
      maxUses: body.maxUses || null,
      usedCount: 0,
      expiresAt: body.expiresAt || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // If product-specific, add to that product's discount codes
    if (body.productId && body.productId !== 'all') {
      const product = await supabaseProductService.findProductById(body.productId);
      
      if (!product || (product as any).userId !== user.id) {
        return NextResponse.json(
          { error: 'Product not found or you do not have permission' },
          { status: 404 }
        );
      }
      
      // Parse existing discount codes or create new array
      let existingCodes = [];
      try {
        if ((product as any).discountCodes) {
          existingCodes = JSON.parse((product as any).discountCodes);
        }
      } catch (error) {
        console.error(`Error parsing discount codes for product ${(product as any).id}:`, error);
      }
      
      // Add the new code
      existingCodes.push(newDiscountCode);
      
      // Update the product with the new codes using Supabase
      await supabaseProductService.updateProductDiscountCodes(
        (product as any).id, 
        JSON.stringify(existingCodes)
      );
      
      // Add product info to the response
      newDiscountCode.productId = (product as any).id;
      newDiscountCode.productName = (product as any).name;
    } else {
      // For global discount codes, we'll add them to all products owned by the user
      // This is a simplified approach - in a real system, you might want a separate table for global codes
      const products = await supabaseProductService.getProductsByUserId(user.id);
      
      // Update each product with the new global code
      for (const product of products) {
        let existingCodes = [];
        try {
          if ((product as any).discountCodes) {
            existingCodes = JSON.parse((product as any).discountCodes);
          }
        } catch (error) {
          console.error(`Error parsing discount codes for product ${(product as any).id}:`, error);
        }
        
        existingCodes.push(newDiscountCode);
        
        await supabaseProductService.updateProductDiscountCodes(
          (product as any).id,
          JSON.stringify(existingCodes)
        );
      }
    }

    return NextResponse.json(newDiscountCode, { status: 201 });
  } catch (error) {
    console.error('Error creating discount code:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}
