import type React from "react"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import dynamic from 'next/dynamic'

// Import the client component wrapper instead of directly importing with ssr: false
import ClientDebugWrapper from '@/components/client-debug-wrapper'

const TopNavigation = dynamic(() => import('@/components/top-navigation'))

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "alaCarte",
  description: "A digital product marketplace platform",
    generator: 'v0.dev'
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const tokenValue = token?.value;

  if (!tokenValue) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(tokenValue, JWT_SECRET) as { userId: string, email: string };

    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });

    console.log(user);

    await prisma.$disconnect();
    return user;
  } catch (error) {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col h-screen">
          <TopNavigation user={await getCurrentUser()} />
          <main className="flex-1 overflow-auto">{children}</main>
          <ClientDebugWrapper />
        </div>
      </body>
    </html>
  )
}
