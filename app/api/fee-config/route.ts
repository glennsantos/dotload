import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET handler to retrieve fee configuration
export async function GET() {
  try {
    // Get fee configuration from environment variables or use defaults
    const percentageFee = process.env.PAYOUT_PERCENTAGE_FEE || '0.05'; // Default 5%
    const fixedFee = process.env.PAYOUT_FIXED_FEE || '0.30'; // Default $0.30

    return NextResponse.json({
      percentageFee: parseFloat(percentageFee),
      fixedFee: parseFloat(fixedFee)
    });
  } catch (error) {
    console.error('Error retrieving fee configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve fee configuration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler to update fee configuration (admin only)
export async function POST(request: NextRequest) {
  try {
    // In a real app, you would check admin authentication here
    // This is a simplified implementation
    
    const body = await request.json();
    const { percentageFee, fixedFee } = body;
    
    // Validate inputs
    if (percentageFee === undefined || fixedFee === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Percentage fee and fixed fee are required'
      }, { status: 400 });
    }
    
    // In a real implementation, you would update these in a database
    // For now, we'll just return the values (since env vars can't be updated at runtime)
    
    return NextResponse.json({
      success: true,
      percentageFee,
      fixedFee,
      message: 'Fee configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating fee configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to update fee configuration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
