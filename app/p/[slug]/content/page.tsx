"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, File, Lock } from "lucide-react"

interface ContentPageProps {
  params: any
  searchParams?: any
}

export default function ContentPage({ params, searchParams }: ContentPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { slug: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const accessCode = searchParamsHook.get('code')
  
  const [purchase, setPurchase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPurchase() {
      if (!accessCode) {
        setError('Invalid access code')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const response = await fetch(`/api/purchases/access?code=${accessCode}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setPurchase(data)
      } catch (err) {
        console.error('Error fetching purchase:', err)
        setError('Failed to load purchase details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [accessCode])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Purchase not found or access code is invalid'}</p>
          <Link href={`/p/${unwrappedParams.slug}`} className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Product
          </Link>
        </div>
      </div>
    )
  }

  // Check if purchase status is completed
  if (purchase.status !== 'completed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <div className="mb-6">
            <Lock size={64} className="mx-auto text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Payment Pending</h2>
          <p className="text-gray-600 mb-6">Your payment is still being processed. Please check back later.</p>
          <Link href={`/p/${unwrappedParams.slug}`} className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Product
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">alacart</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">{purchase.product.name}</h1>
            <p className="text-gray-600 mt-2">Thank you for your purchase. Your content is ready to download.</p>
          </div>
          
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Content</h2>
              
              {purchase.product.digitalItemPath ? (
                <div className="border rounded-lg p-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <File size={40} className="text-gray-400 mr-4" />
                    <div>
                      <h3 className="font-medium">{purchase.product.name} - Digital Content</h3>
                      <p className="text-sm text-gray-500">Download the digital content you purchased</p>
                    </div>
                  </div>
                  <a
                    href={`/api/purchases/download?code=${accessCode}`}
                    className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2"
                    download
                  >
                    <Download size={18} />
                    Download
                  </a>
                </div>
              ) : (
                <div className="border rounded-lg p-6 text-center">
                  <p className="text-gray-600">No digital content available for this product.</p>
                </div>
              )}
            </div>
            
            {purchase.product.files && purchase.product.files.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Files</h2>
                
                <div className="space-y-4">
                  {purchase.product.files.map((file: any) => (
                    <div key={file.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <File size={24} className="text-gray-400 mr-3" />
                        <div>
                          <h3 className="font-medium">{file.filename}</h3>
                          <p className="text-xs text-gray-500">{file.mimetype}</p>
                        </div>
                      </div>
                      <a
                        href={`/api/purchases/download-file/${file.id}?code=${accessCode}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md text-sm inline-flex items-center gap-1 hover:bg-gray-200"
                        download
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 mb-4">
                If you have any questions about your purchase, please contact the seller.
              </p>
              
              <div className="flex space-x-4">
                <Link 
                  href={`/p/${purchase?.product?.slug || unwrappedParams.slug}`}
                  className="text-black hover:underline"
                >
                  Return to Product Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
