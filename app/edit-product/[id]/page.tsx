'use client'

import { useParams } from 'next/navigation'
import ProductCreationForm from '../../create-product/components/ProductCreationForm'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string

  return (
    <div className="min-h-screen bg-white">
      <ProductCreationForm isEditing={true} productId={productId} />
    </div>
  )
}
