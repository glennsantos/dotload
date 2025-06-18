import { Inter } from 'next/font/google';

// Define the Inter font with specific subsets and display settings
// Claude uses a clean, modern font stack with Inter as the primary choice
export const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});
