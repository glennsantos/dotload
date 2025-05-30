import { Inter } from 'next/font/google';

// Define the Inter font with specific subsets and display settings
export const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
