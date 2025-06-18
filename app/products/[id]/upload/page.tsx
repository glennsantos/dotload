import { notFound } from "next/navigation"
import { supabaseProductService } from '@/lib/supabase-db';
import UploadDigitalItem from "../upload-digital-item"

import { use } from "react"

interface UploadDigitalItemPageProps {
  params: any
  searchParams?: any
}

// Fetch product data for verification
async function getProduct(productId: string) {
  try {
    const product = await supabaseProductService.findProductById(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default function UploadDigitalItemPage({ params, searchParams }: UploadDigitalItemPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { id: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  
  const productId = unwrappedParams.id

  // Fetch the product to verify it exists and unwrap the Promise using use()
  const productPromise = getProduct(productId);
  const product = use(productPromise);

  if (!product) {
    notFound()
  }

  return <UploadDigitalItem productId={productId} />
}
