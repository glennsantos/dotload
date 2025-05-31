'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FileInfo {
  id: string;
  filename: string;
  size?: number;
}

export default function TempDownloadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'error'}>({});

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Handle file download
  const handleDownload = async (fileId: string) => {
    try {
      setDownloadStatus(prev => ({ ...prev, [fileId]: 'loading' }));
      
      // Open the file in a new tab using our direct download endpoint
      window.open(`/api/downloads/file/${fileId}`, '_blank');
      
      // Set success status after a short delay
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        
        // Reset status after showing success
        setTimeout(() => {
          setDownloadStatus(prev => ({ ...prev, [fileId]: 'idle' }));
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      
      // Reset error status after a delay
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [fileId]: 'idle' }));
      }, 3000);
    }
  };

  
  // Create temporary access and fetch files on page load
  useEffect(() => {
    async function createTempAccess() {
      if (!accessCode) {
        setError('Access code is required');
        setLoading(false);
        return;
      }

      try {
        // Create temporary access token
        const response = await fetch('/api/purchases/temp-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessCode }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create temporary access');
        }

        const data = await response.json();
        
        // Initialize download status for each file
        const initialStatus: {[key: string]: 'idle' | 'loading' | 'success' | 'error'} = {};
        data.files.forEach((file: FileInfo) => {
          initialStatus[file.id] = 'idle';
        });
        
        setFiles(data.files || []);
        setProductName(data.productName || 'Your Purchase');
        setDownloadStatus(initialStatus);
      } catch (error) {
        console.error('Error creating temporary access:', error);
        setError(error instanceof Error ? error.message : 'Failed to access your purchase');
      } finally {
        setLoading(false);
      }
    }

    createTempAccess();
  }, [accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-light">Loading your purchased content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-center font-light">Access Error</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="font-light"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-light text-gray-900">alacart</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="mx-auto rounded-full bg-emerald-100 p-3 mb-4">
              <Download className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-center text-2xl font-light">Your Downloads</CardTitle>
            <CardDescription className="text-center">
              Thank you for purchasing {productName}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {files.length === 0 ? (
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertTitle>No files available</AlertTitle>
                <AlertDescription>
                  This product doesn't have any downloadable files. Please contact the seller for assistance.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-light text-center mb-4">
                  You can download your purchased files below. These links will be available for 24 hours.
                </p>
                
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-md mr-3">
                        <Download className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{file.filename}</h3>
                        <p className="text-xs text-gray-500 font-light">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleDownload(file.id)}
                      disabled={downloadStatus[file.id] === 'loading'}
                      className="rounded-full font-light bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      {downloadStatus[file.id] === 'loading' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                          Downloading...
                        </>
                      ) : downloadStatus[file.id] === 'success' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Downloaded
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="font-light text-emerald-600 border-emerald-600 hover:bg-emerald-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Purchase
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
