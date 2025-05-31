import { Metadata } from 'next'
import ProductCreationForm from './components/ProductCreationForm'
import CreateProductHeader from './components/CreateProductHeader'

export const metadata: Metadata = {
  title: 'Create New Product | Alacarte',
  description: 'Create a new digital or physical product to sell in your store',
}

export default function CreateProductPage() {
  return (
    <div className="min-h-screen bg-white">
      <CreateProductHeader />
      <ProductCreationForm />
    </div>
  )
}
