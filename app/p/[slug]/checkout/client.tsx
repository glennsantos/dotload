"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ChevronRight, CreditCard, Smartphone, QrCode, Wallet, Tag } from "lucide-react"

interface CheckoutClientProps {
  slug: string
  error?: string
}

export default function CheckoutClient({ slug, error: initialError }: CheckoutClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [user, setUser] = useState<any>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(initialError || errorParam || null)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [selectedVariation, setSelectedVariation] = useState<string>("") // Store selected variation

  // Fetch user data to prepopulate email
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Use the correct API endpoint for getting the current user
        const response = await fetch('/api/auth/me')

        if (response.ok) {
          const userData = await response.json()
          console.log('User data fetched:', userData)
          if (userData && userData.email) {
            setUser(userData)
            setEmail(userData.email)
            console.log('Email set to:', userData.email)
            
            // Force update the email input field by directly setting its value
            const emailInput = document.getElementById('email') as HTMLInputElement
            if (emailInput) {
              emailInput.value = userData.email
            }
          }
        } else {
          console.log('User not logged in or session not available')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [])

  // This effect runs whenever the email state changes
  useEffect(() => {
    // Ensure the email input field is updated when the email state changes
    const emailInput = document.getElementById('email') as HTMLInputElement
    if (emailInput && emailInput.value !== email) {
      emailInput.value = email
    }
  }, [email])  // This effect depends on the email state

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/public/products/${slug}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const productData = await response.json()
        setProduct(productData)
        
        // Set default variation if available
        if (productData.variations && productData.variations.length > 0) {
          const firstVariation = productData.variations[0]
          const firstOption = firstVariation.options ? 
            (typeof firstVariation.options === 'string' ? 
              JSON.parse(firstVariation.options)[0] : 
              firstVariation.options[0]) : 
            ''
          setSelectedVariation(`${firstVariation.id}:${firstOption}`)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Function to validate mobile number format
  const validateMobileNumber = (number: string): boolean => {
    // Simple validation for Philippine mobile numbers
    const regex = /^(09|\+639)\d{9}$/
    return regex.test(number)
  }

  // Function to validate and apply discount code
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      return
    }

    try {
      // Disable the button while validating
      const applyButton = document.getElementById('apply-discount') as HTMLButtonElement
      if (applyButton) {
        applyButton.disabled = true
        applyButton.textContent = 'Checking...'
      }

      const response = await fetch(`/api/discounts/validate?code=${encodeURIComponent(discountCode)}&productId=${product.id}`)
      
      if (!response.ok) {
        throw new Error('Invalid discount code')
      }
      
      const discountData = await response.json()
      
      if (discountData.valid) {
        setAppliedDiscount(discountData)
        // Show success message
        const discountMessage = document.getElementById('discount-message')
        if (discountMessage) {
          discountMessage.textContent = `Discount applied: ${discountData.type === 'percentage' ? `${discountData.amount}%` : `${product.currency} ${discountData.amount}`}`
          discountMessage.className = 'text-sm text-green-600 mt-1'
        }
      } else {
        throw new Error(discountData.message || 'Invalid discount code')
      }
    } catch (err: any) {
      console.error('Error validating discount code:', err)
      // Show error message
      const discountMessage = document.getElementById('discount-message')
      if (discountMessage) {
        discountMessage.textContent = err.message || 'Invalid discount code'
        discountMessage.className = 'text-sm text-red-600 mt-1'
      }
      setAppliedDiscount(null)
    } finally {
      // Re-enable the button
      const applyButton = document.getElementById('apply-discount') as HTMLButtonElement
      if (applyButton) {
        applyButton.disabled = false
        applyButton.textContent = 'Apply'
      }
    }
  }

  // Calculate the final price after discount
  const calculateFinalPrice = (): number => {
    if (!product) return 0
    
    let finalPrice = product.price
    
    // Apply discount if available
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        // Calculate percentage discount
        const discountAmount = (finalPrice * appliedDiscount.amount) / 100
        finalPrice -= discountAmount
      } else if (appliedDiscount.type === 'fixed') {
        // Apply fixed discount
        finalPrice -= appliedDiscount.amount
      }
      
      // Ensure price doesn't go below zero
      finalPrice = Math.max(0, finalPrice)
    }
    
    return finalPrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!email) {
      setPaymentError('Email is required')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setPaymentError('Please enter a valid email address')
      return
    }
    
    // Validate mobile number if provided
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
      setPaymentError('Please enter a valid Philippine mobile number (e.g., 09123456789 or +639123456789)')
      return
    }
    
    // Validate payment method specific fields
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        setPaymentError('Please fill in all card details')
        return
      }
      
      // Basic card validation
      if (cardNumber.replace(/\s/g, '').length < 13) {
        setPaymentError('Please enter a valid card number')
        return
      }
      
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        setPaymentError('Please enter expiry date in MM/YY format')
        return
      }
      
      if (cardCvc.length < 3) {
        setPaymentError('Please enter a valid CVC')
        return
      }
    }
    
    // Start payment processing
    setProcessingPayment(true)
    setPaymentError(null)
    
    try {
      // First create a purchase record
      const purchaseData = {
        productId: product.id,
        email,
        mobileNumber: mobileNumber || undefined,
        paymentMethod,
        discountCode: appliedDiscount ? discountCode : undefined,
        variation: selectedVariation || undefined,
        amount: calculateFinalPrice(),
        currency: product.currency || 'PHP'
      }
      
      console.log('Creating purchase with data:', purchaseData)
      
      // Create the purchase first
      const purchaseResponse = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
      })
      
      const purchaseResult = await purchaseResponse.json()
      
      if (!purchaseResponse.ok) {
        throw new Error(purchaseResult.error || purchaseResult.details || 'Failed to create purchase')
      }
      
      const purchaseId = purchaseResult.id || purchaseResult.purchaseId
      
      if (!purchaseId) {
        throw new Error('Purchase ID not returned from server')
      }
      
      // Handle different payment methods
      if (paymentMethod === 'card') {
        // For card payments, prepare payment data
        const cardPaymentData = {
          purchaseId,
          paymentMethod: 'card',
          amount: calculateFinalPrice(),
          currency: product.currency || 'PHP',
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvc,
          cardName
        }
        
        // Process card payment with Xendit
        const paymentResponse = await fetch('/api/payments/xendit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cardPaymentData)
        })
        
        const paymentResult = await paymentResponse.json()
        
        if (!paymentResponse.ok) {
          throw new Error(paymentResult.error || paymentResult.details || 'Card payment failed')
        }
        
        // Check if we need to redirect for 3DS
        if (paymentResult.redirectUrl) {
          window.location.href = paymentResult.redirectUrl
          return
        }
        
        // Otherwise, redirect to success page
        router.push(`/p/${slug}/success?code=${paymentResult.accessCode || purchaseResult.accessCode}`)
      } else if (paymentMethod === 'gcash' || paymentMethod === 'grabpay' || paymentMethod === 'paymaya') {
        // Map payment method to Xendit e-wallet type
        let ewalletType = 'GCASH'
        if (paymentMethod === 'grabpay') ewalletType = 'GRABPAY'
        if (paymentMethod === 'paymaya') ewalletType = 'MAYA' // Xendit uses 'MAYA' instead of 'PAYMAYA'
        
        // For e-wallets, prepare payment data
        const ewalletPaymentData = {
          purchaseId,
          paymentMethod: 'ewallet-flow',
          amount: calculateFinalPrice(),
          currency: product.currency || 'PHP',
          mobileNumber,
          channelCode: ewalletType
        }
        
        console.log('Processing e-wallet payment with data:', ewalletPaymentData)
        
        // Process e-wallet payment with Xendit
        const paymentResponse = await fetch('/api/payments/xendit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ewalletPaymentData)
        })
        
        const paymentResult = await paymentResponse.json()
        
        if (!paymentResponse.ok) {
          throw new Error(paymentResult.error || paymentResult.details || 'E-wallet payment failed')
        }
        
        // For e-wallets, redirect to the payment page
        if (paymentResult.redirectUrl) {
          window.location.href = paymentResult.redirectUrl
          return
        } else {
          throw new Error('Failed to generate payment link')
        }
      } else {
        // For other payment methods
        router.push(`/p/${slug}/success?purchaseId=${purchaseId}`)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setPaymentError(err.message || 'Payment failed. Please try again.')
      setProcessingPayment(false)
    }
  }

  // If loading or error, show appropriate message
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Loading checkout...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-4 text-gray-600">{error}</p>
          <Link href={`/p/${slug}`} className="mt-6 inline-block text-blue-600 hover:underline">
            <ArrowLeft className="inline-block mr-1" size={16} /> Back to product
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
            <ArrowLeft className="inline-block mr-1" size={16} /> Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href={`/p/${slug}`} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-1" size={16} /> Back to product
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout form */}
          <div className="lg:col-span-7">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                {/* Mobile number field */}
                <div className="mb-6">
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (optional)</label>
                  <input
                    type="tel"
                    id="mobile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    placeholder="09123456789"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
                </div>
                
                {/* Variation selection if available */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Option</label>
                    {product.variations.map((variation: any) => {
                      // Parse options if they're stored as a string
                      const options = typeof variation.options === 'string' ? 
                        JSON.parse(variation.options) : variation.options
                      
                      return (
                        <div key={variation.id} className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">{variation.name}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {options.map((option: string) => {
                              const isSelected = selectedVariation === `${variation.id}:${option}`
                              
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  className={`px-4 py-2 border rounded-md text-sm ${isSelected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                                  onClick={() => setSelectedVariation(`${variation.id}:${option}`)}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Discount code field */}
                <div className="mb-6">
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                  <div className="flex">
                    <input
                      type="text"
                      id="discount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                    <button
                      type="button"
                      id="apply-discount"
                      className="bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300 rounded-r-md hover:bg-gray-200 focus:outline-none focus:ring-black focus:border-black"
                      onClick={validateDiscountCode}
                    >
                      Apply
                    </button>
                  </div>
                  <p id="discount-message" className="text-sm mt-1"></p>
                </div>
                
                {/* Payment method selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${paymentMethod === 'card' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="mr-2" size={16} /> Credit Card
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${paymentMethod === 'gcash' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      onClick={() => setPaymentMethod('gcash')}
                    >
                      <Smartphone className="mr-2" size={16} /> GCash
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${paymentMethod === 'grabpay' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      onClick={() => setPaymentMethod('grabpay')}
                    >
                      <Wallet className="mr-2" size={16} /> GrabPay
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${paymentMethod === 'paymaya' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      onClick={() => setPaymentMethod('paymaya')}
                    >
                      <QrCode className="mr-2" size={16} /> Maya
                    </button>
                  </div>
                </div>
                
                {/* Card details if card payment selected */}
                {paymentMethod === 'card' && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Card Details</h3>
                    
                    <div className="mb-4">
                      <label htmlFor="card-name" className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                      <input
                        type="text"
                        id="card-name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required={paymentMethod === 'card'}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        id="card-number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required={paymentMethod === 'card'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          id="card-expiry"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required={paymentMethod === 'card'}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                        <input
                          type="text"
                          id="card-cvc"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          required={paymentMethod === 'card'}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-4">
                      Your card information is securely processed by our payment provider. We do not store your full card details.
                    </p>
                  </div>
                )}
                
                {/* Payment instructions for other methods */}
                {paymentMethod !== 'card' && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Instructions</h3>
                    <p className="text-sm text-gray-600">
                      After clicking the payment button, you will be redirected to complete your payment with {paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'grabpay' ? 'GrabPay' : 'Maya'}.
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
                    `Pay ${product.currency} ${calculateFinalPrice().toFixed(2)}`
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Order summary */}
          <div className="lg:col-span-5">
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
                </div>
                <p className="text-base font-medium text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
              </div>
              
              {/* Price breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-sm font-medium text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <p className="text-sm">Discount ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `${product.currency} ${appliedDiscount.amount}`})</p>
                    <p className="text-sm font-medium">- {product.currency} {(product.price - calculateFinalPrice()).toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">Taxes</p>
                  <p className="text-sm font-medium text-gray-900">{product.currency} 0.00</p>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <p className="text-base font-medium text-gray-900">Total</p>
                  <p className="text-base font-medium text-gray-900">{product.currency} {calculateFinalPrice().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
