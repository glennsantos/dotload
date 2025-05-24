"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { use } from 'react'

import { 
  CheckoutForm, 
  OrderSummary, 
  LoadingState, 
  ErrorState,
  fetchUserData,
  fetchProduct,
  createPurchase,
  processPayment,
  validateMobileNumber,
  calculateFinalPrice,
  validateDiscountCode,
  Discount,
  Product
} from "./components"

interface CheckoutPageProps {
  params: any
  searchParams?: any
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params) as { slug: string }
  // Get the slug from unwrapped params
  const slug = unwrappedParams.slug;
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  
  const [product, setProduct] = useState<Product | null>(null)
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
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<string>("") // Store selected variation
  const [createdPurchaseId, setCreatedPurchaseId] = useState<string | null>(null);

  // Fetch user data to prepopulate email
  useEffect(() => {
    async function loadUserData() {
      try {
        const userData = await fetchUserData();
        if (userData && userData.user && userData.user.email) {
          setUser(userData.user);
          setEmail(userData.user.email);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    
    loadUserData();
  }, [])

  // We don't need this effect anymore as React will handle the value binding

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const productData = await fetchProduct(slug);
        setProduct(productData);
        
        // Set default variation if available
        if (productData.variations && productData.variations.length > 0) {
          const firstVariation = productData.variations[0];
          const firstOption = firstVariation.options ? 
            (typeof firstVariation.options === 'string' ? 
              JSON.parse(firstVariation.options)[0] : 
              firstVariation.options[0]) : 
            '';
          setSelectedVariation(`${firstVariation.id}:${firstOption}`);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug])

  // Function to handle discount code validation and application
  const handleValidateDiscountCode = () => {
    if (!discountCode || !product) return;
    
    // Reset any previously applied discount
    setAppliedDiscount(null);
    setPaymentError(null);
    
    // Use the imported validateDiscountCode function from utils
    const result = validateDiscountCode(discountCode, product);
    setAppliedDiscount(result.appliedDiscount);
    setPaymentError(result.error);
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) {
      setPaymentError("Product information is missing");
      return;
    }
    
    // Validate form
    if (!email) {
      setPaymentError("Email is required");
      return;
    }
    
    // Mobile number validation for all payments
    if (!mobileNumber) {
      setPaymentError("Mobile number is required");
      return;
    }
    
    // Validate mobile number format
    if (!validateMobileNumber(mobileNumber)) {
      setPaymentError("Please enter a valid mobile number (10-15 digits)");
      return;
    }
    
    // Validate variation selection if product has variations
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      setPaymentError("Please select a product variation");
      return;
    }
    
    if (paymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        setPaymentError("All card details are required");
        return;
      }
    }
    
    try {
      setProcessingPayment(true);
      setPaymentError(null);
      
      // Calculate final price with discount applied
      const finalPrice = calculateFinalPrice(product, appliedDiscount);
      
      // Create a purchase first
      const purchaseData = await createPurchase({
        productId: product.id,
        email,
        mobileNumber,
        amount: finalPrice,
        currency: product.currency || 'PHP',
        discountCode: appliedDiscount ? discountCode : null,
        discountAmount: appliedDiscount ? (product.price - finalPrice) : 0,
        selectedVariation: selectedVariation || null,
      });
      
      console.log('Purchase record created:', purchaseData);

      // Check if the purchase was successful
      if (!purchaseData || !purchaseData.id) {
        throw new Error('Failed to create purchase record or missing purchase ID.');
      }
      setCreatedPurchaseId(purchaseData.id);

      // Bypass payment if final price is 0 or less
      if (finalPrice <= 0) {
        router.push(`/p/${slug}/success?code=${purchaseData.accessCode}`);
        return;
      }
      
      // Determine which payment method to use
      if (paymentMethod.startsWith('ewallet')) {
        // Process e-wallet payment with Xendit
        console.log('Processing e-wallet payment with Xendit');
        
        // Extract the e-wallet type from the payment method (e.g., 'ewallet_gcash' -> 'GCASH')
        const ewalletType = paymentMethod.split('_')[1].toUpperCase();
        
        const paymentData = await processPayment({
          purchaseId: purchaseData.id,
          paymentMethod: 'ewallet-onetime', // Use new one-time payment flow
          channelCode: ewalletType,
          mobileNumber,
          amount: finalPrice,
          currency: product.currency || 'PHP'
        });
        
        console.log('E-wallet payment flow initiated:', paymentData);
        
        // Check for actionUrl (newer API) or redirectUrl (older API)
        if (paymentData.actionUrl) {
          // Redirect to the authentication URL for payment
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
      } else if (paymentMethod.startsWith('direct_debit')) {
        // Process direct debit payment with Xendit
        console.log('Processing direct debit payment with Xendit');
        
        // Extract the direct debit bank code from the payment method (e.g., 'direct_debit_bpi' -> 'BPI')
        const bankCode = paymentMethod.split('_')[2].toUpperCase();
        
        const paymentData = await processPayment({
          purchaseId: purchaseData.id,
          paymentMethod,
          channelCode: bankCode,
          mobileNumber,
          email,
          amount: finalPrice,
          currency: product.currency || 'PHP'
        });
        
        console.log('Direct debit payment flow initiated:', paymentData);
        
        // Check for actionUrl (newer API) or redirectUrl (older API)
        if (paymentData.actionUrl) {
          // Redirect to the authentication URL for payment
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
        const paymentData = await processPayment({
          purchaseId: purchaseData.id,
          paymentMethod,
          cardNumber,
          cardExpiry,
          cardCvc,
          cardName,
          amount: finalPrice,
          currency: product.currency || 'PHP',
        });
        
        console.log('Card payment successful:', paymentData);
        
        // For successful card payments, redirect to success page
        router.push(`/p/${slug}/success?code=${purchaseData.accessCode}`);
      } else {
        // For other payment methods, redirect to success page
        router.push(`/p/${slug}/success?code=${purchaseData.accessCode}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error instanceof Error ? error.message : "Payment processing failed");
      setProcessingPayment(false);
    }
  }
  
  if (loading) {
    return <LoadingState />
  }
  
  if (error || !product) {
    return <ErrorState error={error} slug={slug} />
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href={`/p/${slug}`} className="text-gray-500 hover:text-gray-700 flex items-center">
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
            
            <CheckoutForm
              product={product}
              email={email}
              setEmail={setEmail}
              mobileNumber={mobileNumber}
              setMobileNumber={setMobileNumber}
              selectedVariation={selectedVariation}
              setSelectedVariation={setSelectedVariation}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              setCardExpiry={setCardExpiry}
              cardCvc={cardCvc}
              setCardCvc={setCardCvc}
              cardName={cardName}
              setCardName={setCardName}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              appliedDiscount={appliedDiscount}
              setAppliedDiscount={setAppliedDiscount}
              paymentError={paymentError}
              setPaymentError={setPaymentError}
              processingPayment={processingPayment}
              onSubmit={handleSubmit}
            />
          </div>
          
          {/* Order summary */}
          <div className="lg:col-span-5">
            <OrderSummary 
              product={product} 
              appliedDiscount={appliedDiscount} 
            />
          </div>
        </div>
      </main>
    </div>
  )
}