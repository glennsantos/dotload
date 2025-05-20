import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UploadDigitalItem from "../upload-digital-item"

import { use } from "react"

interface UploadDigitalItemPageProps {
  params: any
  searchParams?: any
}

export default function UploadDigitalItemPage({ params, searchParams }: UploadDigitalItemPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { id: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  
  const productId = unwrappedParams.id

  // Fetch the product to verify it exists and unwrap the Promise using use()
  const productPromise = prisma.product.findUnique({
    where: { id: productId },
  })
  const product = use(productPromise)

  if (!product) {
    notFound()
  }

  return <UploadDigitalItem productId={productId} />
}
