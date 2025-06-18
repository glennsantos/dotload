import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService, supabaseFileService } from '@/lib/supabase-db';
import { getAuthUserId } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    // Authenticate the user
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You must be logged in to upload external links' },
        { status: 401 }
      );
    }

    // Check if the product exists and belongs to the user using Supabase
    const product = await supabaseProductService.findProductById(productId);

    if (!product || (product as any).userId !== userId) {
      return NextResponse.json(
        { error: 'Not found', details: 'Product not found or you do not have permission to modify it' },
        { status: 404 }
      );
    }

    // Get the links from the request body
    const { links } = await request.json();

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Bad request', details: 'No valid links provided' },
        { status: 400 }
      );
    }

    // Create file records for each link using Supabase
    const filePromises = links.map(link => {
      return supabaseFileService.createFile({
        filename: `External Link: ${new URL(link).hostname}`,
        path: link, // Store the URL as the path
        mimetype: 'text/url',
        productId: productId,
      });
    });

    // Execute all file creation promises
    await Promise.all(filePromises);

    return NextResponse.json({ success: true, message: 'External links added successfully' });
  } catch (error) {
    console.error('Error adding external links:', error);
    
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
      { error: 'Server error', details: 'Failed to add external links' },
      { status: 500 }
    );
  }
}
