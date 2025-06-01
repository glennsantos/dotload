'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'success';
};

export default function AlertModal({ isOpen, onClose, title, message, type }: AlertModalProps) {
  // Close modal when pressing Escape key
  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-start">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          
          <div className="ml-4">
            <h3 className={`text-lg font-medium ${
              type === 'error' ? 'text-red-800' : 'text-emerald-800'
            }`}>
              {title}
            </h3>
            <div className="mt-1 text-sm text-stone-600">
              {message}
            </div>
            
            <div className="mt-4">
              <Button
                onClick={onClose}
                className={`w-full ${
                  type === 'error' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white rounded-2xl h-10 font-light`}
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
