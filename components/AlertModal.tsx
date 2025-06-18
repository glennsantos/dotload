'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function AlertModal({ isOpen, onClose, title, message, type }: AlertModalProps) {
  // Close modal when pressing Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-4 bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-md bg-background rounded-2xl p-6 shadow-xl animate-in fade-in-0 slide-in-from-top-4 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-start">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}>
            {type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          
          <div className="ml-4">
            <h3 className={`text-lg font-medium ${
              type === 'error' ? 'text-destructive' : 'text-primary'
            }`} id="modal-title">
              {title}
            </h3>
            <div className="mt-1 text-sm text-muted-foreground" id="modal-description">
              {message}
            </div>
            
            <div className="mt-4">
              <Button
                onClick={onClose}
                variant={type === 'error' ? 'destructive' : 'default'}
                className="w-full rounded-2xl h-10 font-light"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
