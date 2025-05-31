import { NextRequest, NextResponse } from 'next/server';

// This is a proxy endpoint that redirects to the existing change-password API
export async function PUT(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Forward the request to the existing change-password API
    const response = await fetch(new URL('/api/auth/change-password', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(body)
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in password change proxy:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
