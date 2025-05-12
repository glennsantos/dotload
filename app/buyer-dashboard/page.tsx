"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Download, FileText, ExternalLink, Clock, CheckCircle, ShoppingBag, AlertCircle, X } from "lucide-react"

interface Purchase {
  id: string
  productId: string
  amount: number
  currency: string
  paymentMethod: string
  status: string
  email: string
  createdAt: string
  accessCode: string
  product: {
    id: string
    name: string
    slug: string
    description: string
    coverImagePath: string | null
    files: {
      id: string
      filename: string
      path: string
      mimetype: string
      size: number
    }[]
  }
}

export default function BuyerDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessCode = searchParams.get('code')
  
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPaymentPendingModal, setShowPaymentPendingModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<{name: string, status: string} | null>(null)

  useEffect(() => {
    async function fetchPurchases() {
      try {
        setLoading(true)
        
        // If we have an access code, use it to fetch the specific purchase
        if (accessCode) {
          const response = await fetch(`/api/purchases/access?code=${accessCode}`)
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Only show the purchase if it's not failed
          if (data.status !== 'failed') {
            setPurchases([data])
          } else {
            setPurchases([])
          }
          
          // Check if user exists or needs to be created
          const userResponse = await fetch('/api/auth/me')
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUserDetails(userData.user)
          } else {
            // User not logged in or doesn't exist
            setEmail(data.email || '')
            setShowUserForm(true)
          }
        } else {
          // If no access code, fetch all purchases for the logged-in user
          const response = await fetch('/api/purchases')
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Filter out failed payments
          const filteredPurchases = Array.isArray(data) 
            ? data.filter(purchase => purchase.status !== 'failed')
            : []
            
          setPurchases(filteredPurchases)
        }
      } catch (err) {
        console.error('Error fetching purchases:', err)
        setError('Failed to load purchase details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [accessCode])

  const handleSubmitUserDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    
    try {
      // Create or update user account
      const response = await fetch('/api/auth/create-from-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          accessCode,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create account')
      }
      
      const data = await response.json()
      setUserDetails(data.user)
      setShowUserForm(false)
      
      // Refresh the page to update auth state
      router.refresh()
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading your purchases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (showUserForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">Complete Your Account</h1>
          
          <p className="text-gray-600 mb-6">
            Please provide the following information to access your purchase and create your account.
          </p>
          
          {formError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmitUserDetails}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
                readOnly={!!email}
              />
              {email && (
                <p className="text-xs text-gray-500 mt-1">
                  This is the email address used for your purchase.
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Create Account & Access Purchase"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">alaCarte</h1>
          {userDetails && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                {userDetails.name || userDetails.email}
              </span>
              <Link 
                href="/settings" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Settings
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Purchases</h1>
        
        {purchases.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <ShoppingBag size={64} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-medium mb-4">You don't have any purchases yet</h2>
            <p className="text-gray-600 mb-6">
              When you buy products on alaCarte, they will appear here for easy access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products" 
                className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center justify-center gap-2"
              >
                Browse Products
              </Link>
              <Link 
                href="/" 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md inline-flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/4">
                    <div className="aspect-video relative rounded-md overflow-hidden">
                      {purchase.product.coverImagePath ? (
                        <Image 
                          src={purchase.product.coverImagePath.startsWith('http') 
                            ? purchase.product.coverImagePath 
                            : `/${purchase.product.coverImagePath}`
                          } 
                          alt={purchase.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FileText className="text-gray-400" size={48} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{purchase.product.name}</h2>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock size={16} className="mr-1" />
                      <span>Purchased on {new Date(purchase.createdAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        {purchase.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Files:</h3>
                      {purchase.product.files && purchase.product.files.length > 0 ? (
                        <ul className="space-y-2">
                          {purchase.product.files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <span className="truncate flex-1">{file.filename}</span>
                              {purchase.status === 'completed' || purchase.status === 'succeeded' ? (
                                <a 
                                  href={`/api/purchases/download?fileId=${file.id}&accessCode=${purchase.accessCode}`}
                                  className="ml-4 text-blue-600 hover:text-blue-500 flex items-center"
                                  download
                                >
                                  <Download size={16} className="mr-1" />
                                  Download
                                </a>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setPendingFile({
                                      name: file.filename,
                                      status: purchase.status
                                    })
                                    setShowPaymentPendingModal(true)
                                  }}
                                  className="ml-4 text-blue-600 hover:text-blue-500 flex items-center"
                                >
                                  <Download size={16} className="mr-1" />
                                  Download
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No files available for this product.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/6 flex flex-col items-start">
                    <div className="text-lg font-bold mb-1">
                      {purchase.currency} {purchase.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      via {purchase.paymentMethod}
                    </div>
                    
                    <Link 
                      href={`/p/${purchase.product.slug}`}
                      className="text-blue-600 hover:text-blue-500 flex items-center text-sm"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View Product Page
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Payment Pending Modal */}
      {showPaymentPendingModal && pendingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowPaymentPendingModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle size={48} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Payment Processing</h3>
              <p className="text-gray-600 mb-4">
                {pendingFile.status === 'pending' ? (
                  <>Your payment for <strong>{pendingFile.name}</strong> is still being processed. You'll be able to download this file once the payment is completed.</>
                ) : pendingFile.status === 'awaiting_capture' ? (
                  <>Your payment for <strong>{pendingFile.name}</strong> is awaiting capture. You'll be able to download this file once the payment is completed.</>
                ) : (
                  <>Your payment is being processed. You'll be able to download this file once the payment is completed.</>
                )}
              </p>
              <button
                onClick={() => setShowPaymentPendingModal(false)}
                className="mt-4 px-4 py-2 bg-black text-white rounded-md w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
