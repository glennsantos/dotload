"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, ChevronRight } from "lucide-react"
import RichTextEditor from "@/components/rich-text-editor"

export default function ProductEditPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
  })
  const [isUploading, setIsUploading] = useState(false)

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
        setFormData({
          name: foundProduct.name,
          description: foundProduct.description,
          price: foundProduct.price.toString(),
          type: foundProduct.type,
        })
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          type: formData.type,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const updatedProduct = await response.json()
      setProduct(updatedProduct)
      alert('Product updated successfully')
    } catch (err) {
      console.error('Error updating product:', err)
      alert('Failed to update product. Please try again later.')
    }
  }

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
          <Link href={`/products/${params.id}`} className="text-gray-600 hover:text-black">
            {product.name}
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Edit</span>
        </div>
      </div>

      <header className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/products/${params.id}`} className="text-gray-500 hover:text-black">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-normal truncate">Edit {product.name}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex border-b mb-6">
          <button
            className={`px-6 py-3 ${activeTab === "details" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Product
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "variations" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("variations")}
          >
            Variations
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "content" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("content")}
          >
            Content
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "pricing" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            Pricing
          </button>
        </div>
          
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="border rounded-md p-6">
                <h2 className="text-xl font-medium mb-4">Basic Information</h2>
                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 font-medium">
                    Product name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-md"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 font-medium">
                    Description
                  </label>
                  <RichTextEditor 
                    value={formData.description || ''}
                    onChange={(value) => setFormData({...formData, description: value})}
                    placeholder="Describe your product"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="price" className="block mb-2 font-medium">
                    Price
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                      ₱
                    </span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-r-md"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="type" className="block mb-2 font-medium">
                    Product type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-md"
                  >
                    <option value="">Select a product type</option>
                    <option value="digital_product">Digital Product</option>
                    <option value="physical_product">Physical Product</option>
                    <option value="service">Service</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <div className="border rounded-md p-6">
                <h2 className="text-xl font-medium mb-4">Cover Image</h2>
                
                <div className="space-y-4">
                  <div className="aspect-video relative rounded-md overflow-hidden border">
                    {product.coverImagePath ? (
                      <Image 
                        src={product.coverImagePath.startsWith('http') ? product.coverImagePath : `/${product.coverImagePath}`} 
                        alt={product.name} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No cover image</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-medium">Replace Cover Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-2 border rounded-md"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          setIsUploading(true);
                          const formData = new FormData();
                          formData.append('coverImage', e.target.files[0]);
                          
                          try {
                            const response = await fetch(`/api/products/${params.id}/cover-image`, {
                              method: 'POST',
                              body: formData,
                            });
                            
                            if (!response.ok) {
                              throw new Error(`Error: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            setProduct({
                              ...product,
                              coverImagePath: result.coverImagePath
                            });
                            alert('Cover image updated successfully');
                          } catch (error) {
                            console.error('Error uploading cover image:', error);
                            alert('Failed to upload cover image. Please try again.');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="mt-2 text-sm text-blue-600 flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        Uploading image...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "variations" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Product Variations</h2>
              
              {product.variations && product.variations.length > 0 ? (
                <div className="space-y-4">
                  {product.variations.map((variation: any, index: number) => (
                    <div key={variation.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">{variation.name || `Variation ${index + 1}`}</h3>
                        <button className="text-red-500 text-sm">Remove</button>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">Variation Name</label>
                        <input
                          type="text"
                          defaultValue={variation.name}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-sm font-medium">Options</label>
                        <div className="space-y-2">
                          {JSON.parse(variation.options || '[]').map((option: string, optionIndex: number) => (
                            <div key={optionIndex} className="flex gap-2">
                              <input
                                type="text"
                                defaultValue={option}
                                className="flex-1 p-2 border rounded-md"
                              />
                              <button className="p-2 text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <button className="mt-2 flex items-center gap-1 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Add Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                  <h3 className="font-medium mb-2">No variations added yet</h3>
                  <p className="text-gray-600 mb-4">Add variations like size, color, or format to give customers more options</p>
                  <button className="px-4 py-2 bg-black text-white rounded-md">
                    Add Variation
                  </button>
                </div>
              )}
              
              {product.variations && product.variations.length > 0 && (
                <button className="mt-4 flex items-center gap-2 px-4 py-2 border rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Another Variation
                </button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Product Content</h2>
              
              {product.files && product.files.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Files</h3>
                  <ul className="border rounded-md divide-y">
                    {product.files.map((file: any) => (
                      <li key={file.id} className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          <span>{file.filename}</span>
                        </div>
                        <button className="text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div>
                    <label className="block mb-2 font-medium">Add Files</label>
                    <input
                      type="file"
                      multiple
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                  <h3 className="font-medium mb-2">No content files added yet</h3>
                  <p className="text-gray-600 mb-4">Upload files that customers will receive after purchase</p>
                  <input
                    type="file"
                    multiple
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Pricing</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Price</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                      $
                    </span>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="flex-1 p-3 border rounded-r-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-md p-6">
              <div className="mb-4 font-medium">Discount codes</div>
              <div className="border rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Offer discount codes</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="offerCoupons" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="text-gray-500 text-sm">
                  Enable discount codes for this product. You can create and manage discount codes in the settings.
                </div>
              </div>

              <div className="mb-4 font-medium">Payment options</div>
              <div className="border rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Allow customers to pay what they want</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="payWhatYouWant" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="text-gray-500 text-sm">
                  Let customers choose how much they want to pay for this product.
                </div>
              </div>

              <div className="mb-4 font-medium">Shipping information</div>
              <div className="border rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Collect shipping information</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="collectShipping" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="text-gray-500 text-sm">
                  Collect shipping information from customers during checkout.
                </div>
              </div>

              <div className="mb-4 font-medium">Preview</div>
              <div className="border rounded p-4">
                <div className="p-4 border rounded mb-4">
                  <div className="font-medium mb-2">Checkout Preview</div>
                  <div className="flex justify-between mb-2">
                    <div>{product.name}</div>
                    <div>${product.price.toFixed(2)}</div>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <div>Total</div>
                    <div>${product.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
