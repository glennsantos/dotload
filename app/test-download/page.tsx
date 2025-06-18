'use client';

import React, { useState, useEffect } from 'react';
import { DownloadButton } from '@/components/DownloadButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function TestDownloadPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileId, setFileId] = useState('');
  const { toast } = useToast();

  // Fetch some files to test with
  useEffect(() => {
    async function fetchFiles() {
      try {
        setIsLoading(true);
        
        // Fetch files from the database
        const response = await fetch('/api/files?limit=10');
        
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching files:', error);
        toast({
          title: 'Error',
          description: 'Failed to load files. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFiles();
  }, [toast]);

  // Function to test the old download endpoint
  const testOldDownload = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/secure-download', {
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
      window.open(data.url, '_blank');
      
      toast({
        title: 'Old Download Link Generated',
        description: 'Testing the old download endpoint.',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate download link',
        variant: 'destructive',
      });
    }
  };

  // Function to manually test with a specific file ID
  const testWithCustomId = () => {
    if (!fileId) {
      toast({
        title: 'Error',
        description: 'Please enter a file ID',
        variant: 'destructive',
      });
      return;
    }
    
    // Use our new DownloadButton component which uses the new endpoint
    // The button click will handle the rest
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Secure Download Testing</h1>
      
      {/* Manual testing section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test with Custom File ID</CardTitle>
          <CardDescription>Enter a file ID to test the download functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="fileId">File ID</Label>
              <Input 
                id="fileId" 
                value={fileId} 
                onChange={(e) => setFileId(e.target.value)} 
                placeholder="Enter file ID"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => testOldDownload(fileId)}
            disabled={!fileId}
          >
            Test Old Endpoint
          </Button>
          <DownloadButton 
            fileId={fileId} 
            label="Test New Endpoint" 
            variant="default"
            className="ml-2"
          />
        </CardFooter>
      </Card>
      
      {/* File list section */}
      <h2 className="text-2xl font-semibold mb-4">Available Files</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted">
          <p>No files found. Please upload some files first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id}>
              <CardHeader>
                <CardTitle className="truncate">{file.filename}</CardTitle>
                <CardDescription>ID: {file.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 truncate">Path: {file.path}</p>
                {file.productId && (
                  <p className="text-sm text-gray-500">Product: {file.productId}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => testOldDownload(file.id)}
                  size="sm"
                >
                  Old Endpoint
                </Button>
                <DownloadButton 
                  fileId={file.id} 
                  label="New Endpoint" 
                  variant="default"
                  size="sm"
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
