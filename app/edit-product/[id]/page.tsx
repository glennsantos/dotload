'use client'

import { useParams } from 'next/navigation'
import ProductCreationForm from '../../create-product/components/ProductCreationForm'
import CreateProductHeader from '../../create-product/components/CreateProductHeader'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string

  return (
    <div className="min-h-screen bg-white">
      <CreateProductHeader isEdit={true} />
      <ProductCreationForm isEditing={true} productId={productId} />
    </div>
  )
}
