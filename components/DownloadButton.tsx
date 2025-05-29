import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface DownloadButtonProps {
  fileId: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Button component that generates and uses a secure download link
 */
export function DownloadButton({
  fileId,
  label = 'Download',
  variant = 'default',
  size = 'default',
  className = '',
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Request a secure download URL from the server
      const response = await fetch('/api/downloads/secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate download link');
      }

      const data = await response.json();
      
      // Open the download URL in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

/**
 * Button component that uses a direct download link (for already generated links)
 */
export function DirectDownloadButton({
  downloadUrl,
  label = 'Download',
  variant = 'default',
  size = 'default',
  className = '',
}: {
  downloadUrl: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  return (
    <Button
      onClick={() => window.open(downloadUrl, '_blank')}
      variant={variant}
      size={size}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
