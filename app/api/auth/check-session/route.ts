import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    // Return only necessary user information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
