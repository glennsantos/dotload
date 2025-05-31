"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, XCircle } from "lucide-react"

interface FailurePageProps {
  params: any
  searchParams?: any
}

export default function FailurePage({ params, searchParams }: FailurePageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { slug: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const errorCode = searchParamsHook.get('error')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/public/products/${unwrappedParams.slug}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const productData = await response.json()
        setProduct(productData)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [unwrappedParams.slug])

  // Get error message based on error code
  const getErrorMessage = () => {
    switch (errorCode) {
      case 'payment_failed':
        return 'Your payment could not be processed. Please try again or use a different payment method.';
      case 'payment_cancelled':
        return 'Your payment was cancelled. No charges were made to your account.';
      case 'payment_expired':
        return 'Your payment session has expired. Please try again.';
      default:
        return 'There was an issue with your payment. Please try again.';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">alaC art</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="mb-6">
            <XCircle size={64} className="mx-auto text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            {getErrorMessage()}
          </p>
          
          <div className="mb-8">
            <Link 
              href={`/p/${product?.slug || unwrappedParams.slug}/checkout`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              Try Again
            </Link>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              If you continue to experience issues, please try a different payment method or contact support.
            </p>
            
            <Link 
              href={`/p/${product?.slug || unwrappedParams.slug}`}
              className="text-black hover:underline"
            >
              Return to Product Page
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
