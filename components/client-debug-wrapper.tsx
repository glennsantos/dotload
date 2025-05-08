"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import the debug overlay component with ssr: false in this client component
const DebugOverlay = dynamic(() => import('@/components/debug-overlay'), { 
  ssr: false 
});

export default function ClientDebugWrapper() {
  const [isDevelopment, setIsDevelopment] = useState(false);
  
  useEffect(() => {
    // Check if we're in development mode on the client side
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  // Only render in development mode
  if (!isDevelopment) return null;
  
  return <DebugOverlay />;
}
