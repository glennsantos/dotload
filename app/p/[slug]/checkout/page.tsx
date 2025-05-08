"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, CreditCard, Smartphone, QrCode } from "lucide-react"

interface CheckoutPageProps {
  params: {
    slug: string
  }
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/public/products/${params.slug}`)
        
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
  }, [params.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!email) {
      setPaymentError("Email is required")
      return
    }
    
    if (!mobileNumber) {
      setPaymentError("Mobile number is required")
      return
    }
    
    if (paymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        setPaymentError("All card details are required")
        return
      }
    }
    
    try {
      setProcessingPayment(true)
      setPaymentError(null)
      
      // Create payment intent based on payment method
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          email,
          mobileNumber,
          paymentMethod,
          amount: product.price,
          currency: product.currency,
          cardDetails: paymentMethod === "card" ? {
            number: cardNumber,
            expiry: cardExpiry,
            cvc: cardCvc,
            name: cardName,
          } : undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }
      
      // Use the product's slug if available, otherwise fall back to the URL parameter
      const slugToUse = product.slug || params.slug
      
      // Handle different payment methods
      if (paymentMethod === "card") {
        // Card payments are processed directly
        router.push(`/p/${slugToUse}/success?code=${data.accessCode}`)
      } else {
        // E-wallet payments require redirect
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        } else {
          router.push(`/p/${slugToUse}/success?code=${data.accessCode}`)
        }
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      setPaymentError(err.message || "Payment failed. Please try again.")
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
          <Link href="/" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              Home
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <Link href={`/p/${product.slug || params.slug}`} className="text-gray-600 hover:text-black">
              {product.name}
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="font-medium">Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          {/* Checkout form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h2>
              
              {/* Email field */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              {/* Mobile number field */}
              <div className="mb-6">
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                  placeholder="+63 XXX XXX XXXX"
                  required
                />
              </div>
              
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
              
              {/* Payment method selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "card" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard size={20} />
                  <span>Card</span>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "gcash" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("gcash")}
                >
                  <Smartphone size={20} />
                  <span>GCash</span>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "grabpay" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("grabpay")}
                >
                  <Smartphone size={20} />
                  <span>GrabPay</span>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "shopeepay" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("shopeepay")}
                >
                  <Smartphone size={20} />
                  <span>ShopeePay</span>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "maya" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("maya")}
                >
                  <Smartphone size={20} />
                  <span>Maya</span>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer flex items-center gap-3 ${
                    paymentMethod === "qrph" ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => setPaymentMethod("qrph")}
                >
                  <QrCode size={20} />
                  <span>QR Ph</span>
                </div>
              </div>
              
              {/* Card payment form */}
              {paymentMethod === "card" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                      Name on card
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Card number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                      placeholder="4111 1111 1111 1111"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration date (MM/YY)
                      </label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        id="cardCvc"
                        name="cardCvc"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* E-wallet payment message */}
              {paymentMethod !== "card" && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    You will be redirected to complete your payment with {paymentMethod === "gcash" ? "GCash" : 
                    paymentMethod === "grabpay" ? "GrabPay" : 
                    paymentMethod === "shopeepay" ? "ShopeePay" : 
                    paymentMethod === "maya" ? "Maya" : 
                    paymentMethod === "qrph" ? "QR Ph" : paymentMethod}.
                  </p>
                </div>
              )}
              
              {/* Payment error message */}
              {paymentError && (
                <div className="mb-6 p-4 bg-red-50 rounded-md text-red-600">
                  {paymentError}
                </div>
              )}
              
              {/* Submit button */}
              <button
                type="submit"
                className="w-full bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  `Pay ${product.currency} ${product.price.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
          
          {/* Order summary */}
          <div className="mt-10 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
              
              {/* Product details */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                  {product.coverImagePath ? (
                    <Image
                      src={product.coverImagePath}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{product.description?.substring(0, 100) || 'No description'}</p>
                </div>
                <p className="text-base font-medium text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
              </div>
              
              {/* Price breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-sm font-medium text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
                </div>
                
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">Taxes</p>
                  <p className="text-sm font-medium text-gray-900">{product.currency} 0.00</p>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <p className="text-base font-medium text-gray-900">Total</p>
                  <p className="text-base font-medium text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
