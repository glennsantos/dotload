"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ChevronRight, File, FileText, Image as ImageIcon, Video, Music, Archive, Download, ExternalLink, Upload, Loader2 } from "lucide-react"

// Helper function to get the appropriate icon based on file type
function getFileIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) {
    return <ImageIcon size={20} className="text-blue-500" />
  } else if (mimetype.startsWith('video/')) {
    return <Video size={20} className="text-purple-500" />
  } else if (mimetype.startsWith('audio/')) {
    return <Music size={20} className="text-green-500" />
  } else if (mimetype.startsWith('application/pdf')) {
    return <FileText size={20} className="text-red-500" />
  } else if (mimetype.startsWith('application/zip') || mimetype.startsWith('application/x-rar')) {
    return <Archive size={20} className="text-orange-500" />
  } else if (mimetype === 'text/url') {
    return <ExternalLink size={20} className="text-teal-500" />
  } else {
    return <File size={20} className="text-gray-500" />
  }
}

export default function ProductContentPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params as any) as { id: string };
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${unwrappedParams.id}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const productData = await response.json()
        setProduct(productData)
        console.log('Product data:', productData)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [unwrappedParams.id])

  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <Link href={`/products/${unwrappedParams.id}`} className="text-gray-600 hover:text-black">
            Product
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Content</span>
        </div>
      </div>
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-normal">Product Content</h1>
          <Link 
            href={`/products/${params.id}/upload`} 
            className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2"
          >
            <Upload size={18} /> Upload New Content
          </Link>
        </div>
        
        {loading ? (
          <div className="border rounded-md p-12 bg-white flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading product content...</p>
            </div>
          </div>
        ) : error ? (
          <div className="border rounded-md p-12 bg-white text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href={`/products/${unwrappedParams.id}`} className="text-blue-500 hover:underline">
              Back to Product
            </Link>
          </div>
        ) : (
          <div className="border rounded-md p-6 bg-white">
            {!product?.files || product.files.length === 0 ? (
              <div className="text-center py-12">
                <File size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-medium mb-2">No Content Files</h2>
                <p className="text-gray-600 mb-6">This product doesn't have any content files yet.</p>
                <Link 
                  href={`/products/${unwrappedParams.id}/upload`} 
                  className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2"
                >
                  <Upload size={18} /> Upload Content
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-medium mb-4">Content Files</h2>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-3 px-4 font-medium">File</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Size</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.files.map((file: any) => (
                        <tr key={file.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.mimetype)}
                              <span className="truncate max-w-[300px]">{file.filename}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {file.mimetype === 'text/url' ? 'External Link' : file.mimetype.split('/')[1]?.toUpperCase() || file.mimetype}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {file.mimetype === 'text/url' ? '-' : 
                              file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {file.mimetype === 'text/url' ? (
                              <a 
                                href={file.path} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink size={16} /> Open
                              </a>
                            ) : (
                              <a 
                                href={file.path} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Download size={16} /> Download
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 