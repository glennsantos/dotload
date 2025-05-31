import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma"

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
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });

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
    redirect('/login');
  }
}
