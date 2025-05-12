import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You must be logged in to upload external links' },
        { status: 401 }
      );
    }

    // Get the product ID from the URL parameters
    const productId = params.id;

    // Check if the product exists and belongs to the user
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
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

    // Create file records for each link
    const filePromises = links.map(link => {
      return prisma.file.create({
        data: {
          filename: `External Link: ${new URL(link).hostname}`,
          path: link, // Store the URL as the path
          mimetype: 'text/url',
          product: {
            connect: {
              id: productId,
            },
          },
        },
      });
    });

    // Execute all file creation promises
    await Promise.all(filePromises);

    return NextResponse.json({ success: true, message: 'External links added successfully' });
  } catch (error) {
    console.error('Error adding external links:', error);
    return NextResponse.json(
      { error: 'Server error', details: 'Failed to add external links' },
      { status: 500 }
    );
  }
}
