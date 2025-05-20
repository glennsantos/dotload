import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }
    
    // Get user from token
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized: No token found' },
        { status: 401 }
      )
    }
    
    // Retrieve JWT secret from login route for consistency
    const JWT_SECRET = process.env.JWT_SECRET!.trim(); // Ensure no whitespace
    let decoded;
    try {
      // Log token details for debugging
      console.log('JWT Secret:', JWT_SECRET);
      console.log('Token Value:', token.value);
      console.log('Token Length:', token.value?.length);
      
      // Verify token with detailed logging
      decoded = jwt.verify(token.value, JWT_SECRET, {
        algorithms: ['HS256'], // Specify the expected algorithm
        maxAge: '24h' // Match the token expiration from login route
      }) as { userId: string, email: string };
      
      console.log('Decoded Token:', decoded);
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      
      // Detailed error logging
      if (jwtError instanceof Error) {
        console.error('Error Name:', jwtError.name);
        console.error('Error Message:', jwtError.message);
        console.error('Error Stack:', jwtError.stack);
      }
      
      return NextResponse.json(
        { 
          message: 'Invalid or expired authentication token',
          error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
          details: {
            name: jwtError instanceof Error ? jwtError.name : 'UnknownError',
            token: token.value ? 'Token present' : 'No token',
            tokenLength: token.value?.length || 0
          }
        },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while changing password' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
