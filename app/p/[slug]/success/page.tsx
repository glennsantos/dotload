"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ArrowLeft, Download } from "lucide-react"

interface SuccessPageProps {
  params: any
  searchParams?: any
}

export default function SuccessPage({ params, searchParams }: SuccessPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { slug: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const accessCode = searchParamsHook.get('code')
  
  const [purchase, setPurchase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  // Function to check payment status using purchase ID
  const checkPaymentStatus = async (purchaseId: string) => {
    try {
      console.log(`Checking payment status for purchase ID: ${purchaseId}`);
      const response = await fetch(`/api/payments/status?purchaseId=${purchaseId}`);
      
      if (!response.ok) {
        throw new Error(`Error checking payment status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Payment status response:', data);
      
      if (data.status) {
        setPaymentStatus(data.status);
      }
      return data;
    } catch (err) {
      console.error('Error checking payment status:', err);
      return null;
    }
  };

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
        
        // Check payment status for pending purchases
        if (data.status !== 'completed') {
          console.log(`Purchase ${data.id} is not completed. Checking payment status...`);
          await checkPaymentStatus(data.id);
          
          // Refresh the purchase data to get updated status
          const refreshResponse = await fetch(`/api/purchases/access?code=${accessCode}`);
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            setPurchase(refreshedData);
          }
        }
      } catch (err) {
        console.error('Error fetching purchase:', err)
        setError('Failed to load purchase details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [accessCode, searchParamsHook])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Purchase not found'}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">alaCarte</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle size={64} className="mx-auto text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Your Purchase!</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your payment was successful and your order has been processed.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Order Details</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">{purchase.product.name}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{purchase.currency} {purchase.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{purchase.paymentMethod}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(purchase.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Access Your Content</h2>
            
            <p className="text-gray-600 mb-4">
              You can access your purchased content using the link below:
            </p>
            
            <Link 
              href={`/buyer-dashboard?code=${accessCode}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              <Download size={20} />
              Access Content
            </Link>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              {purchase.status === 'completed' 
                ? `A confirmation email has been sent to ${purchase.email} with your purchase details.`
                : purchase.status === 'pending'
                  ? `Your payment is being processed. You will receive an email at ${purchase.email} once the payment is confirmed.`
                  : `A confirmation email has been sent to ${purchase.email} with your purchase details.`
              }
            </p>
            
            <Link 
              href={`/p/${purchase?.product?.slug || unwrappedParams.slug}`}
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
