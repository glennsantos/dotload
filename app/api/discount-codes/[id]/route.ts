import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseProductService } from '@/lib/supabase-db';

export async function DELETE(request: NextRequest) {
  try {
    // Extract the discount code ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'Discount code ID is required' },
        { status: 400 }
      );
    }

    // Get all products with discount codes using Supabase
    const products = await supabaseProductService.getProductsByUserId(user.id);
    
    let codeDeleted = false;
    
    // Go through each product and remove the discount code if found
    for (const product of products) {
      if (!(product as any).discountCodes) continue;
      
      try {
        // Parse the discount codes
        const codes = JSON.parse((product as any).discountCodes);
        
        if (!Array.isArray(codes)) continue;
        
        // Find the index of the code to delete
        const codeIndex = codes.findIndex((code: any) => code.id === id);
        
        if (codeIndex !== -1) {
          // Remove the code
          codes.splice(codeIndex, 1);
          
          // Update the product using Supabase
          await supabaseProductService.updateProduct((product as any).id, {
            discountCodes: JSON.stringify(codes)
          });
          
          codeDeleted = true;
        }
      } catch (error) {
        console.error(`Error parsing discount codes for product ${(product as any).id}:`, error);
      }
    }
    
    if (!codeDeleted) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    
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
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}
