import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Discount code ID is required' },
        { status: 400 }
      );
    }

    // Get all products with discount codes
    const products = await prisma.product.findMany({
      where: {
        userId: user.id,
        discountCodes: {
          not: null
        }
      },
      select: {
        id: true,
        discountCodes: true
      }
    });
    
    let codeDeleted = false;
    
    // Go through each product and remove the discount code if found
    for (const product of products) {
      if (!product.discountCodes) continue;
      
      try {
        // Parse the discount codes
        const codes = JSON.parse(product.discountCodes);
        
        if (!Array.isArray(codes)) continue;
        
        // Find the index of the code to delete
        const codeIndex = codes.findIndex((code: any) => code.id === id);
        
        if (codeIndex !== -1) {
          // Remove the code
          codes.splice(codeIndex, 1);
          
          // Update the product
          await prisma.product.update({
            where: { id: product.id },
            data: {
              discountCodes: JSON.stringify(codes)
            }
          });
          
          codeDeleted = true;
        }
      } catch (error) {
        console.error(`Error parsing discount codes for product ${product.id}:`, error);
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
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}
