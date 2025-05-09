"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowLeft, Edit, BarChart2, Share2, ExternalLink, ChevronRight, Download, File, Check } from "lucide-react"
import RichTextRenderer from "@/components/rich-text-renderer"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("product")
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [productUrl, setProductUrl] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/products`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const products = await response.json()
        const foundProduct = Array.isArray(products) ? 
          products.find(p => p.id === params.id) : null
        
        if (!foundProduct) {
          throw new Error('Product not found')
        }
        
        setProduct(foundProduct)
        setProductUrl(`${window.location.origin}/p/${foundProduct.slug || foundProduct.id}`)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
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
          <Link href="/products" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Products
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">{product.name}</span>
        </div>
      </div>

      <header className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/products" className="text-gray-500 hover:text-black">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-normal truncate">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${params.id}/edit`} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <Edit size={18} /> Edit
          </Link>
          <button 
            className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2"
            onClick={() => setActiveTab("share")}
          >
            <Share2 size={18} /> Share
          </button>
        </div>
      </header>

      <div className="border-b">
        <div className="flex flex-wrap">
          <button
            className={`px-6 py-3 ${activeTab === "product" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("product")}
          >
            Product
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "share" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("share")}
          >
            Share
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "analytics" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === "product" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-4">Product Details</h2>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Product Type</div>
                      <div className="font-medium">{product.type === "ebook" ? "E-book" : product.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Price</div>
                      <div className="font-medium">${product.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Published</div>
                      <div className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Published
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <RichTextRenderer 
                      content={product.description || 'No description available'}
                      className="text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="sticky top-6">
                <div className="border rounded-md overflow-hidden">
                  {product.coverImagePath ? (
                    <Image
                      src={product.coverImagePath.startsWith('http') ? product.coverImagePath : `/${product.coverImagePath}`}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-auto mb-4 rounded"
                    />
                  ) : (
                    <div className="w-full h-[200px] bg-gray-200 flex items-center justify-center mb-4">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-purple-200 text-sm px-2 py-1 rounded">${product.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">0 ratings</div>
                    </div>
                    <Link
                      href={`/p/${product.slug || params.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1 w-full p-2 border rounded-md text-sm hover:bg-gray-50 mt-2"
                    >
                      View Live <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "share" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Product Share</h2>
              <div className="border rounded-md p-6 bg-white">
                <div className="mb-4 font-medium">Share options</div>
                <div className="border rounded p-4 mb-4">
                  <div className="mb-4">
                    <div className="font-medium mb-2">Product URL</div>
                    <div className="flex">
                      <input
                        type="text"
                        value={`${window.location.origin}/p/${product.slug || params.id}`}
                        readOnly
                        className="flex-1 p-3 border rounded-l-md bg-gray-100"
                      />
                      <button 
                        className="px-4 py-2 bg-black text-white rounded-r-md flex items-center justify-center min-w-[80px]"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${product.slug || params.id}`)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                      >
                        {copied ? <Check size={18} /> : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="font-medium mb-2">Social Media</div>
                    <p className="text-sm text-gray-600 mb-4">Share your product on social media</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`Check out ${product.name}`)}`, '_blank')} 
                          className="px-4 py-2 bg-black text-white rounded-md"
                        >
                          X (Twitter)
                        </button>
                        <button 
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank')} 
                          className="px-4 py-2 bg-blue-800 text-white rounded-md"
                        >
                          Facebook
                        </button>
                        <button 
                          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`, '_blank')} 
                          className="px-4 py-2 bg-[#0077b5] text-white rounded-md"
                        >
                          LinkedIn
                        </button>
                      </div>
                  </div>
                </div>
                <div className="mb-4 font-medium">Preview</div>
                <div className="border rounded p-4">
                  <div className="flex items-center gap-4 p-4 border rounded">
                    {product.coverImagePath ? (
                      <Image 
                        src={product.coverImagePath.startsWith('http') ? product.coverImagePath : `/${product.coverImagePath}`} 
                        alt={product.name}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-[80px] h-[80px] bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <RichTextRenderer 
                        content={product.description || 'No description available'}
                        className="text-gray-600"
                      />
                      <div className="text-sm font-medium">${product.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-1">Sales</div>
                  <div className="text-3xl font-medium">0</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-1">Views</div>
                  <div className="text-3xl font-medium">0</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
                  <div className="text-3xl font-medium">0%</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Sales Chart</h2>
              <div className="border rounded-md p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart2 size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">No sales data available yet</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
