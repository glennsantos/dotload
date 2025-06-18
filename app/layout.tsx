import type React from "react"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseUserService } from '@/lib/supabase-db';
import type { Metadata } from "next"
import "./globals.css"

// Import the client component wrapper instead of directly importing with ssr: false
import ClientDebugWrapper from '@/components/client-debug-wrapper';
import { AuthProviderWrapper } from '@/components/providers/auth-provider-wrapper';

// Import the fonts
import { inter } from './fonts'


export const metadata: Metadata = {
  title: "dotload",
  description: "A digital product marketplace platform",
  generator: 'Glenn Santos'
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const tokenValue = token?.value;

  if (!tokenValue) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(tokenValue, JWT_SECRET) as { userId: string, email: string };

    const user = await supabaseUserService.findUserById(decoded.userId);

    return user ? {
      id: (user as any).id,
      name: (user as any).name,
      email: (user as any).email
    } : null;
  } catch (error) {
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      console.error('Database error in layout:', error.message);
    }
    return null;
  }
}

// Top navigation has been removed to match the design requirements

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get current user
  const currentUser = await getCurrentUser();
  
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans antialiased">
        <div className="flex flex-col h-screen bg-background text-foreground">
          <AuthProviderWrapper initialUser={currentUser}>
            <main className="flex-1 overflow-auto">{children}</main>
          </AuthProviderWrapper>
          <ClientDebugWrapper />
        </div>
      </body>
    </html>
  )
}
