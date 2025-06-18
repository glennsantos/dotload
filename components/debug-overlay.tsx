"use client";

import { useState, useEffect } from 'react';

// Extend the Window interface to include our debug utilities
declare global {
  interface Window {
    debugUtils?: {
      logEvent: (message: string) => void;
    };
  }
}

export default function DebugOverlay() {
  const [events, setEvents] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Create a custom event listener for debugging
    const handleDebugEvent = (event: CustomEvent) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      setEvents(prev => [`${timestamp} - ${event.detail}`, ...prev.slice(0, 9)]);
    };

    // Add the event listener
    window.addEventListener('debug-event' as any, handleDebugEvent as any);

    // Clean up
    return () => {
      window.removeEventListener('debug-event' as any, handleDebugEvent as any);
    };
  }, []);

  // Helper function to dispatch debug events from anywhere in the app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Properly declare the global interface extension
      if (!window.debugUtils) {
        window.debugUtils = {
          logEvent: (message: string) => {
            const event = new CustomEvent('debug-event', { detail: message });
            window.dispatchEvent(event);
          }
        };
      }
    }
  }, []);

  if (!isVisible) {
    return (
      <button
        className="fixed bottom-2 right-2 bg-muted text-muted-foreground p-2 rounded-full z-[9999] hover:bg-muted/80"
        onClick={() => setIsVisible(!isVisible)}
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-4 max-w-xs w-full max-h-64 overflow-auto z-[9999] text-xs font-mono">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Debug Console</h3>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
      <div className="space-y-1">
        {events.length === 0 ? (
          <p className="text-muted-foreground">No events logged yet</p>
        ) : (
          events.map((event, i) => (
            <div key={i} className="border-b border-muted-foreground pb-1">
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
