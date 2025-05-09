/**
 * Calculates the processing fee for transactions
 * 
 * Fee structure:
 * - Percentage fee: A percentage of the transaction amount
 * - Fixed fee: A constant amount added to the percentage fee
 */
export interface FeeConfig {
  percentageFee: number; // Percentage fee (e.g., 0.10 for 10%)
  fixedFee: number;      // Fixed fee amount
}

/**
 * Default fee configuration
 * Can be easily modified or retrieved from environment variables
 */
export const DEFAULT_PAYOUT_FEE_CONFIG: FeeConfig = {
  percentageFee: Number(process.env.PAYOUT_PERCENTAGE_FEE) || 0.05, // 5% percentage fee
  fixedFee: Number(process.env.PAYOUT_FIXED_FEE) || 15         // PHP 15 fixed fee
};

/**
 * Calculate the total processing fee for a given amount
 * 
 * @param amount - The transaction amount
 * @param config - Fee configuration (defaults to DEFAULT_PAYOUT_FEE_CONFIG)
 * @returns The total processing fee
 */
export function calculateProcessingFee(
  amount: number, 
  config: FeeConfig = DEFAULT_PAYOUT_FEE_CONFIG
): number {
  const percentageFee = amount * config.percentageFee;
  const totalFee = percentageFee + config.fixedFee;
  
  return totalFee;
}

/**
 * Calculate the net amount after deducting processing fee
 * 
 * @param amount - The gross transaction amount
 * @param config - Fee configuration (defaults to DEFAULT_PAYOUT_FEE_CONFIG)
 * @returns The net amount after processing fee
 */
export function calculateNetAmount(
  amount: number, 
  config: FeeConfig = DEFAULT_PAYOUT_FEE_CONFIG
): number {
  const processingFee = calculateProcessingFee(amount, config);
  return amount - processingFee;
}
