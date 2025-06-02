// API configuration for handling large file uploads
import { NextRequest } from 'next/server';

export const apiConfig = {
  api: {
    // Set the body parser size limit to 100MB
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

// Helper function to check if a file exceeds size limit
export function checkFileSizeLimit(file: File, maxSizeMB = 50): boolean {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSize;
}

// Helper function to format file size in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
}
