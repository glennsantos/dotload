import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Handle GET requests for direct link access (e.g., <a href="/api/auth/logout">Logout</a>)
export async function GET(request: NextRequest) {
  try {
    // Create a response that will clear the token cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0), // Set to past date to delete
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Handle POST requests for programmatic logout
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
