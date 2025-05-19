"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ChevronRight, CreditCard, Smartphone, QrCode, Wallet, Tag } from "lucide-react"

interface CheckoutPageProps {
  params: {
    slug: string
  }
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params as any) as { slug: string };
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
  const [paymentError, setPaymentError] = useState<string | null>(errorParam || null)
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
        const response = await fetch(`/api/public/products/${unwrappedParams.slug}`)
        
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
  }, [unwrappedParams.slug])

  // Function to validate mobile number format
  const validateMobileNumber = (number: string): boolean => {
    // Basic mobile number validation - should be numeric and at least 10 digits
    // This can be adjusted based on specific country requirements
    const mobileRegex = /^[0-9]{10,15}$/;
    return mobileRegex.test(number.replace(/[\s-()]/g, ''));
  }
  
  // Function to validate and apply discount code
  const validateDiscountCode = () => {
    if (!discountCode || !product) return;
    
    // Reset any previously applied discount
    setAppliedDiscount(null);
    setPaymentError(null);
    
    try {
      // Parse discount codes from product
      const discountCodes = product.discountCodes ? 
        (typeof product.discountCodes === 'string' ? 
          JSON.parse(product.discountCodes) : 
          product.discountCodes) : 
        [];

      console.log(product.discountCodes)
      
      // Find matching discount code
      const matchedDiscount = discountCodes.find(
        (code: any) => code.code.toLowerCase() === discountCode.toLowerCase()
      );
      
      if (!matchedDiscount) {
        setPaymentError("Invalid discount code");
        return;
      }
      
      // Check if discount is within valid date range
      const currentDate = new Date();
      const startDate = matchedDiscount.startDate ? new Date(matchedDiscount.startDate) : null;
      const endDate = matchedDiscount.endDate ? new Date(matchedDiscount.endDate) : null;
      
      if ((startDate && currentDate < startDate) || (endDate && currentDate > endDate)) {
        setPaymentError("Discount code is not valid at this time");
        return;
      }
      
      // Apply the discount
      setAppliedDiscount(matchedDiscount);
    } catch (err) {
      console.error('Error applying discount code:', err);
      setPaymentError("Error applying discount code");
    }
  }
  
  // Calculate the final price after discount
  const calculateFinalPrice = (): number => {
    if (!product) return 0;
    
    let price = product.price;
    
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        // Apply percentage discount
        const discountAmount = (parseFloat(appliedDiscount.amount) / 100) * price;
        price = price - discountAmount;
      } else if (appliedDiscount.type === 'fixed') {
        // Apply fixed amount discount
        price = price - parseFloat(appliedDiscount.amount);
      }
      
      // Ensure price doesn't go below zero
      price = Math.max(price, 0);
    }
    
    return price;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!email) {
      setPaymentError("Email is required")
      return
    }
    
    // Mobile number validation for all payments
    if (!mobileNumber) {
      setPaymentError("Mobile number is required")
      return
    }
    
    // Validate mobile number format
    if (!validateMobileNumber(mobileNumber)) {
      setPaymentError("Please enter a valid mobile number (10-15 digits)")
      return
    }
    
    // Validate variation selection if product has variations
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      setPaymentError("Please select a product variation")
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
      
      // Calculate final price with discount applied
      const finalPrice = calculateFinalPrice()
      
      // Create a purchase first
      const purchaseResponse = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          email,
          mobileNumber,
          amount: finalPrice,
          currency: product.currency || 'PHP',
          discountCode: appliedDiscount ? discountCode : null,
          discountAmount: appliedDiscount ? (product.price - finalPrice) : 0,
          selectedVariation: selectedVariation || null,
        }),
      })
      
      const purchaseData = await purchaseResponse.json()
      
      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || "Failed to create purchase")
      }
      
      // Process payment based on method
      if (paymentMethod.startsWith('ewallet')) {
        // Handle e-wallet payment with Xendit
        const paymentResponse = await fetch("/api/payments/xendit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchaseId: purchaseData.id,
            paymentMethod,
            mobileNumber,
            amount: finalPrice,
            currency: product.currency || 'PHP',
          }),
        })
        
        const paymentData = await paymentResponse.json()
        
        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || "Failed to process payment")
        }
        
        // Handle the redirect response from the API
        if (paymentData.redirect && paymentData.redirectUrl) {
          console.log(`Redirecting to: ${paymentData.redirectUrl}`);
          // Use window.location.href for a full page redirect
          window.location.href = paymentData.redirectUrl;
        } else if (paymentData.requiresAction && paymentData.actionUrl) {
          // Redirect to the authentication URL for account linking
          console.log('Redirecting to authentication URL:', paymentData.actionUrl);
          window.location.href = paymentData.actionUrl;
        } else if (paymentData.redirectUrl) {
          // For backward compatibility
          console.log('Redirecting to payment gateway:', paymentData.redirectUrl);
          window.location.href = paymentData.redirectUrl;
        } else if (paymentData.checkoutUrl) {
          // Legacy support for checkoutUrl
          console.log('Redirecting to checkout URL:', paymentData.checkoutUrl);
          window.location.href = paymentData.checkoutUrl;
        } else {
          throw new Error('No redirect URL provided for payment');
        }
      } else if (paymentMethod === "card") {
        // Process card payment with Xendit
        console.log('Processing card payment with Xendit');
        const paymentResponse = await fetch("/api/payments/xendit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchaseId: purchaseData.id,
            paymentMethod,
            cardNumber,
            cardExpiry,
            cardCvc,
            cardName,
            amount: finalPrice,
            currency: product.currency || 'PHP',
          }),
        });
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || paymentData.details || "Failed to process card payment");
        }
        
        console.log('Card payment successful:', paymentData);
        
        // For successful card payments, redirect to success page
        router.push(`/p/${unwrappedParams.slug}/success?code=${purchaseData.accessCode}`);
      } else {
        // For other payment methods, redirect to success page
        router.push(`/p/${unwrappedParams.slug}/success?code=${purchaseData.accessCode}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setPaymentError(error instanceof Error ? error.message : "Payment processing failed")
      setProcessingPayment(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-xl mb-4">{error || "Product not found"}</div>
        <Link href="/" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Return to Home
        </Link>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href={`/p/${unwrappedParams.slug}`} className="text-gray-500 hover:text-gray-700 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Product
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
            
            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
              {/* Email field */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              {/* Mobile number field */}
              <div className="mb-6">
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 09123456789"
                  required
                />
              </div>
              
              {/* Product Variations */}
              {product?.variations && product.variations.length > 0 && (
                <div className="mb-6">
                  <label htmlFor="variation" className="block text-sm font-medium text-gray-700 mb-1">Select Variation</label>
                  <select
                    id="variation"
                    name="variation"
                    value={selectedVariation}
                    onChange={(e) => setSelectedVariation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a variation</option>
                    {product.variations.map((variation: any) => {
                      const options = typeof variation.options === 'string' ? 
                        JSON.parse(variation.options) : variation.options;
                      
                      return options.map((option: string, optionIndex: number) => (
                        <option key={`${variation.id}-${optionIndex}`} value={`${variation.id}:${option}`}>
                          {variation.name}: {option}
                        </option>
                      ));
                    })}
                  </select>
                </div>
              )}
              
              {/* Discount Code field */}
              <div className="mb-6">
                <label htmlFor="discountCode" className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                <div className="flex">
                  <input
                    type="text"
                    id="discountCode"
                    name="discountCode"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter discount code"
                  />
                  <button
                    type="button"
                    onClick={validateDiscountCode}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-r-md flex items-center"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Apply
                  </button>
                </div>
                {appliedDiscount && (
                  <div className="mt-2 text-sm text-green-600">
                    Discount applied: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `${product.currency} ${appliedDiscount.amount}`} off
                  </div>
                )}
              </div>
              
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
              
              {/* Payment method selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex-shrink-0 mr-3">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Credit Card</p>
                    <p className="text-xs text-gray-500">Pay with Credit Card</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('ewallet_gcash')}
                >
                  <div className="flex-shrink-0 mr-3">
                    <Smartphone className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">GCash</p>
                    <p className="text-xs text-gray-500">Pay with GCash</p>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_grabpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('ewallet_grabpay')}
                >
                  <div className="flex-shrink-0 mr-3">
                    <Wallet className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">GrabPay</p>
                    <p className="text-xs text-gray-500">Pay with GrabPay</p>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_paymaya' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('ewallet_paymaya')}
                >
                  <div className="flex-shrink-0 mr-3">
                    <QrCode className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Maya</p>
                    <p className="text-xs text-gray-500">Pay with Maya</p>
                  </div>
                </div>

                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_shopee' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('ewallet_shopee')}
                >
                  <div className="flex-shrink-0 mr-3">
                    <QrCode className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Shopee</p>
                    <p className="text-xs text-gray-500">Pay with Shopee</p>
                  </div>
                </div>
              </div>
              
              {/* Card payment details heading */}
              {paymentMethod === "card" && (
                <h2 className="text-lg font-medium text-gray-900 mb-4">Card Details</h2>
              )}
              
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
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment method specific instructions */}
              {paymentMethod !== "card" && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    You will be redirected to complete your payment with {paymentMethod.includes('gcash') ? "GCash" : 
                      paymentMethod.includes('grabpay') ? "GrabPay" : 
                      paymentMethod.includes('shopeepay') ? "ShopeePay" : 
                      paymentMethod.includes('paymaya') ? "Maya" : 
                      paymentMethod}.
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