import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a response that will clear the token cookie
    const response = NextResponse.json({ 
      message: 'Logged out successfully' 
    }, { status: 200 });

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0), // Set to past date to delete
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json({ 
      error: 'Logout failed', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
