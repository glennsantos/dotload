import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseUserService } from '@/lib/supabase-db';

export const metadata: Metadata = {
  title: 'Transactions | alacart',
  description: 'Track your income and payouts',
};


export default async function LedgerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // If no token, redirect to login
  if (!token) {
    redirect('/login');
  }

  try {
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; emailVerified?: boolean };
    
    // Get the user from the database using Supabase
    const user = await supabaseUserService.findUserById(decoded.userId);

    // If user not found, redirect to login
    if (!user) {
      redirect('/login');
    }

    return (
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    // If token is invalid, redirect to login
    console.error('Authentication error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      console.error('Database error in layout:', error.message);
    }
    
    redirect('/login');
  }
}
