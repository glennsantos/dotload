import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get domain from environment variables
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const BASE_URL = DOMAIN.startsWith('http') ? DOMAIN : `http://${DOMAIN}`;

// Handle GET requests for direct link access (e.g., <a href="/api/auth/logout">Logout</a>)
export async function GET(request: NextRequest) {
  try {
    console.log(`Using domain for redirect: ${BASE_URL}`);
    
    // Create a response that will clear the token cookie and redirect to login
    // Use the BASE_URL from environment variables instead of request.url
    const response = NextResponse.redirect(`${BASE_URL}/login`);

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0), // Set to past date to delete
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(`${BASE_URL}/login`);
  }
}

// Handle POST requests for programmatic logout
export async function POST(request: NextRequest) {
  try {
    console.log(`Using domain for redirect: ${BASE_URL}`);
    
    // Create a response that will clear the token cookie
    const response = NextResponse.json({ 
      message: 'Logged out successfully',
      redirectUrl: `${BASE_URL}/login` // Include the redirect URL in the response
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
