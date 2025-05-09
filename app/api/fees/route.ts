import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PAYOUT_FEE_CONFIG, calculateProcessingFee } from '../../../lib/fee-utils';

/**
 * Handles GET requests to `/api/fees`.
 *
 * Returns the fee configuration and example calculations.
 *
 * @param request - The NextRequest object.
 * @returns A JSON response containing fee configuration and example calculations.
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for sample calculation
    const searchParams = request.nextUrl.searchParams;
    const sampleAmount = parseFloat(searchParams.get('amount') || '1000');
    
    // Calculate sample fee
    const sampleFee = calculateProcessingFee(sampleAmount);
    const sampleNetAmount = sampleAmount - sampleFee;
    
    // Return fee configuration and sample calculations
    return NextResponse.json({
      feeConfig: DEFAULT_PAYOUT_FEE_CONFIG,
      examples: {
        amount: sampleAmount,
        processingFee: sampleFee,
        netAmount: sampleNetAmount,
        percentageFeeAmount: sampleAmount * DEFAULT_PAYOUT_FEE_CONFIG.percentageFee,
        fixedFeeAmount: DEFAULT_PAYOUT_FEE_CONFIG.fixedFee,
      },
      description: `Processing fee is ${DEFAULT_PAYOUT_FEE_CONFIG.percentageFee * 100}% of the amount plus a fixed fee of PHP ${DEFAULT_PAYOUT_FEE_CONFIG.fixedFee}.`
    });
  } catch (error) {
    console.error('Error fetching fee configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee configuration' },
      { status: 500 }
    );
  }
}
