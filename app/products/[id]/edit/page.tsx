"use client"

import { useState, useEffect, use } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, ChevronRight } from "lucide-react"
import RichTextEditor from "@/components/rich-text-editor"
import { isAllowedDigitalFile } from '@/lib/file-validation'
import { validatePrice, validateDiscountAmount } from '@/lib/form-validation'

// Variation Item Component for managing individual variations
const VariationItem = ({ variation, index, onUpdate, onDelete }: { 
  variation: { id?: string, name: string, options: string[] }, 
  index: number, 
  onUpdate: (data: {name: string, options: string[]}) => void,
  onDelete: () => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(variation.name);
  const [editedOptions, setEditedOptions] = useState([...variation.options]);
  
  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Variation #{index + 1}</h3>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button 
                className="text-blue-600 text-sm"
                onClick={() => {
                  onUpdate({
                    name: editedName,
                    options: editedOptions
                  });
                  setIsEditing(false);
                }}
              >
                Save
              </button>
              <button 
                className="text-gray-500 text-sm"
                onClick={() => {
                  setEditedName(variation.name);
                  setEditedOptions([...variation.options]);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              className="text-blue-600 text-sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button 
            className="text-red-500 text-sm"
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">Variation Name</label>
        <input
          type="text"
          value={isEditing ? editedName : variation.name}
          onChange={(e) => isEditing && setEditedName(e.target.value)}
          className="w-full p-2 border rounded-md"
          disabled={!isEditing}
        />
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium">Options</label>
        <div className="space-y-2">
          {(isEditing ? editedOptions : variation.options).map((option, optionIndex) => (
            <div key={optionIndex} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  if (isEditing) {
                    const newOptions = [...editedOptions];
                    newOptions[optionIndex] = e.target.value;
                    setEditedOptions(newOptions);
                  }
                }}
                className="flex-1 p-2 border rounded-md"
                disabled={!isEditing}
              />
              {isEditing && (
                <button 
                  className="p-2 text-red-500"
                  onClick={() => {
                    const newOptions = editedOptions.filter((_, i) => i !== optionIndex);
                    setEditedOptions(newOptions);
                  }}
                  aria-label="Remove option"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {isEditing && (
          <button 
            className="mt-2 flex items-center gap-1 text-blue-600"
            onClick={() => {
              setEditedOptions([...editedOptions, '']);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Option
          </button>
        )}
      </div>
    </div>
  );
};

interface ProductEditPageProps {
  params: any
  searchParams?: any
}

export default function ProductEditPage({ params, searchParams }: ProductEditPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { id: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
    visibility: "",
    status: "",
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [saveResult, setSaveResult] = useState<{success: boolean, message: string}>({success: false, message: ''})
  const [discountCodes, setDiscountCodes] = useState<Array<{code: string, amount: string, type: string, startDate: string, endDate: string}>>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean,
    code: string,
    index: number
  }>({ isOpen: false, code: '', index: -1 })
  const [editingDiscount, setEditingDiscount] = useState<{
    isEditing: boolean,
    index: number,
    code: any
  }>({isEditing: false, index: -1, code: null})
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    amount: '',
    type: 'percentage',
    startDate: '',
    endDate: ''
  })
  const [variations, setVariations] = useState<Array<{id?: string, name: string, options: string[]}>>([]) 
  const [newVariation, setNewVariation] = useState<{name: string, options: string[]}>({name: '', options: ['']})
  const [deleteVariationConfirmation, setDeleteVariationConfirmation] = useState<{isOpen: boolean, id: string, index: number}>({isOpen: false, id: '', index: -1})
  const [isSavingVariation, setIsSavingVariation] = useState(false)

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
          products.find(p => p.id === unwrappedParams.id) : null
        
        if (!foundProduct) {
          throw new Error('Product not found')
        }
        
        setProduct(foundProduct);
        setFormData({
          name: foundProduct.name || '',
          description: foundProduct.description || '',
          price: foundProduct.price?.toString() || '',
          type: foundProduct.type || '',
          visibility: foundProduct.isPublic ? 'public' : 'private',
          status: foundProduct.status || 'active',
        });
        
        // Initialize discount codes if available
        if (foundProduct.discountCodes) {
          try {
            const parsedCodes = typeof foundProduct.discountCodes === 'string' 
              ? JSON.parse(foundProduct.discountCodes) 
              : foundProduct.discountCodes;
            setDiscountCodes(Array.isArray(parsedCodes) ? parsedCodes : []);
          } catch (err) {
            console.error('Error parsing discount codes:', err);
            setDiscountCodes([]);
          }
        }
        
        // Initialize variations if available
        if (foundProduct.variations && foundProduct.variations.length > 0) {
          try {
            const processedVariations = foundProduct.variations.map((variation: any) => ({
              id: variation.id,
              name: variation.name,
              options: typeof variation.options === 'string' ? JSON.parse(variation.options) : variation.options
            }));
            setVariations(processedVariations);
          } catch (err) {
            console.error('Error processing variations:', err);
            setVariations([]);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [unwrappedParams.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    console.log(formData)
  }
  
  const handleDescriptionChange = (value: string) => {
    setFormData({
      ...formData,
      description: value
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/products/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          type: formData.type,
          isPublic: formData.visibility === "public",
          status: formData.status,
          allowPayWhatYouWant: product.allowPayWhatYouWant,
          offerCoupons: product.offerCoupons,
          discountCodes: product.offerCoupons ? JSON.stringify(discountCodes) : null
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const result = await response.json();

      // Set success message and show confirmation modal
      setSaveResult({
        success: true,
        message: 'Product updated successfully!'
      });
      setShowSaveConfirmation(true);
    } catch (error) {
      console.error('Error updating product:', error);

      // Set error message and show confirmation modal
      setSaveResult({
        success: false,
        message: 'Failed to update product. Please try again.'
      });
      setShowSaveConfirmation(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new option to a variation being created
  const handleAddOption = () => {
    setNewVariation({
      ...newVariation,
      options: [...newVariation.options, '']
    });
  };

  // Handle removing an option from a variation being created
  const handleRemoveOption = (index: number) => {
    setNewVariation({
      ...newVariation,
      options: newVariation.options.filter((_, i) => i !== index)
    });
  };

  // Handle option text change for a new variation
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newVariation.options];
    updatedOptions[index] = value;
    setNewVariation({
      ...newVariation,
      options: updatedOptions
    });
  };

  // Handle adding a new variation
  const handleAddVariation = async () => {
    if (!newVariation.name.trim()) {
      toast.error('Variation name is required');
      return;
    }

    if (newVariation.options.some(option => !option.trim())) {
      toast.error('All options must have a value');
      return;
    }

    setIsSavingVariation(true);

    try {
      const response = await fetch(`/api/products/${unwrappedParams.id}/variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newVariation.name,
          options: JSON.stringify(newVariation.options),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error: ${response.status}`);
      }

      const newVariationData = await response.json();
      
      // Add the new variation to the list
      setVariations([...variations, {
        id: newVariationData.id,
        name: newVariationData.name,
        options: typeof newVariationData.options === 'string' 
          ? JSON.parse(newVariationData.options) 
          : newVariationData.options
      }]);

      // Reset the form
      setNewVariation({ name: '', options: [''] });
      toast.success('Variation added successfully');
    } catch (error) {
      console.error('Error adding variation:', error);
      toast.error('Failed to add variation. Please try again.');
    } finally {
      setIsSavingVariation(false);
    }
  };

  // Handle updating an existing variation
  const handleUpdateVariation = async (variationId: string, updatedData: {name: string, options: string[]}) => {
    try {
      const response = await fetch(`/api/products/${unwrappedParams.id}/variations/${variationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedData.name,
          options: JSON.stringify(updatedData.options),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error: ${response.status}`);
      }

      // Update the variation in the local state
      setVariations(variations.map(v => 
        v.id === variationId ? {
          ...v,
          name: updatedData.name,
          options: updatedData.options
        } : v
      ));

      toast.success('Variation updated successfully');
    } catch (error) {
      console.error('Error updating variation:', error);
      toast.error('Failed to update variation. Please try again.');
    }
  };

  // Handle deleting a variation
  const handleDeleteVariation = async () => {
    if (!deleteVariationConfirmation.id) return;
    
    try {
      const response = await fetch(`/api/products/${unwrappedParams.id}/variations/${deleteVariationConfirmation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error: ${response.status}`);
      }

      // Remove the variation from the local state
      setVariations(variations.filter(v => v.id !== deleteVariationConfirmation.id));
      setDeleteVariationConfirmation({isOpen: false, id: '', index: -1});
      toast.success('Variation deleted successfully');
    } catch (error) {
      console.error('Error deleting variation:', error);
      toast.error('Failed to delete variation. Please try again.');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/products/${unwrappedParams.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      window.location.href = '/products'
    } catch (err) {
      console.error('Error deleting product:', err)
      toast.error('Failed to delete product. Please try again later.')
      setIsDeleting(false)
      setShowDeleteModal(false)
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
        <Toaster position="top-right" />
      </div>
    )
  }

  return (
    <div>
      <header className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/products/${unwrappedParams.id}`} className="text-gray-500 hover:text-black">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-normal truncate">Edit {product.name}</h1>
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

      <div className="p-4 sm:p-6">
        {/* Mobile Dropdown Navigation */}
        <div className="md:hidden mb-6">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="details">Product</option>
            <option value="variations">Variations</option>
            <option value="content">Content</option>
            <option value="pricing">Pricing</option>
            <option value="settings">Settings</option>
          </select>
        </div>
        
        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex border-b mb-6">
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
          <button
            className={`px-6 py-3 ${activeTab === "settings" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
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
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={handleDescriptionChange}
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
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow integers (no decimals)
                        const integerRegex = /^\d*$/
                        if (value === '' || integerRegex.test(value)) {
                          setFormData({ ...formData, price: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value
                        if (value !== '') {
                          const numValue = parseInt(value, 10)
                          const validation = validatePrice(numValue)
                          if (!validation.isValid) {
                            alert(validation.error!) // Simple alert for now, could be improved with modal
                            // Reset to valid range
                            if (numValue < 1) {
                              setFormData({ ...formData, price: '1' })
                            } else if (numValue > 500000) {
                              setFormData({ ...formData, price: '500000' })
                            }
                          }
                        }
                      }}
                      className="w-full p-3 border rounded-r-md"
                      placeholder="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
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
                    <option value="ebook">eBook</option>
                    <option value="audiobook">Audiobook</option>
                    <option value="course">Course</option>
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
                            const response = await fetch(`/api/products/${unwrappedParams.id}/cover-image`, {
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
              <p className="text-gray-600 mb-6">Add variations like size, color, or format to give customers more options</p>
              
              {variations.length > 0 ? (
                <div className="space-y-6">
                  {variations.map((variation, index) => {
                    // Using a unique key for each variation component to maintain state properly
                    const variationKey = variation.id || `new-variation-${index}`;
                    return (
                      <VariationItem 
                        key={variationKey}
                        variation={variation}
                        index={index}
                        onUpdate={(updatedData) => {
                          if (variation.id) {
                            handleUpdateVariation(variation.id, updatedData);
                          }
                        }}
                        onDelete={() => {
                          if (variation.id) {
                            setDeleteVariationConfirmation({
                              isOpen: true,
                              id: variation.id,
                              index: index
                            });
                          } else {
                            // For variations not yet saved to DB
                            setVariations(variations.filter((_, i) => i !== index));
                          }
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                  <h3 className="font-medium mb-2">No variations added yet</h3>
                  <p className="text-gray-600 mb-4">Add variations like size, color, or format to give customers more options</p>
                </div>
              )}
              
              {/* Form to add a new variation */}
              <div className="mt-6 border-t pt-6">
                <h3 className="font-medium mb-4">Add New Variation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Variation Name</label>
                    <input
                      type="text"
                      value={newVariation.name}
                      onChange={(e) => setNewVariation({...newVariation, name: e.target.value})}
                      placeholder="e.g., Size, Color, Material"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Options</label>
                    <div className="space-y-2">
                      {newVariation.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 p-2 border rounded-md"
                          />
                          <button 
                            className="p-2 text-red-500"
                            onClick={() => handleRemoveOption(index)}
                            disabled={newVariation.options.length <= 1}
                            aria-label="Remove option"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      className="mt-2 flex items-center gap-1 text-blue-600"
                      onClick={handleAddOption}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Add Option
                    </button>
                  </div>
                  
                  <button 
                    className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2"
                    onClick={handleAddVariation}
                    disabled={isSavingVariation}
                  >
                    {isSavingVariation ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>Add Variation</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Variation Delete Confirmation Modal */}
        {deleteVariationConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-medium mb-4">Delete Variation</h3>
              <p className="mb-6">Are you sure you want to delete this variation? This action cannot be undone.</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteVariationConfirmation({isOpen: false, id: '', index: -1})}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteVariation}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Variation
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Product Content</h2>
              
              <div className="space-y-6">
                {/* Included Content Section */}
                <div>
                  {product.files && product.files.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Product Files</h3>
                      <ul className="border rounded-md divide-y">
                        {product.files.map((file: any) => (
                          <li key={file.id} className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                              <div>
                                <div className="font-medium">{file.filename}</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {file.path && (
                                    <>
                                      Path: {file.path.startsWith('http') ? (
                                        <a href={file.path} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">{file.path}</a>
                                      ) : (
                                        <a href={`/api/secure-files/${encodeURIComponent(file.path)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">Secure File Link</a>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this file?')) {
                                  try {
                                    const response = await fetch(`/api/products/${unwrappedParams.id}/files/${file.id}`, {
                                      method: 'DELETE',
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error(`Error: ${response.status}`);
                                    }
                                    
                                    // Update the product state by removing the deleted file
                                    setProduct({
                                      ...product,
                                      files: product.files.filter((f: any) => f.id !== file.id)
                                    });
                                    
                                    toast.success('File deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting file:', error);
                                    toast.error('Failed to delete file. Please try again.');
                                  }
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed rounded-md mb-4">
                      <h4 className="font-medium mb-2">No files added yet</h4>
                      <p className="text-gray-600 text-sm">Upload files that customers will receive after purchase</p>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <div className="flex flex-col space-y-3">
                      <input
                        type="file"
                        multiple
                        id="file-upload"
                        className="hidden w-full p-2 border rounded-md"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setIsUploading(true);
                            
                            // Validate file types before uploading
                            const newFiles = Array.from(e.target.files);
                            const invalidFiles = newFiles.filter(file => !isAllowedDigitalFile(file.name, file.type));
                            
                            if (invalidFiles.length > 0) {
                              setIsUploading(false);
                              toast.error(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Please upload only supported file types.`);
                              e.target.value = '';
                              return;
                            }
                            
                            const formData = new FormData();
                            
                            for (let i = 0; i < e.target.files.length; i++) {
                              formData.append('files', e.target.files[i]);
                            }
                            
                            try {
                              const response = await fetch(`/api/products/${unwrappedParams.id}/files`, {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Error: ${response.status}`);
                              }
                              
                              const result = await response.json();
                              
                              // Update the product state with the new files
                              setProduct({
                                ...product,
                                files: [...(product.files || []), ...result.files]
                              });
                              
                              toast.success('Files uploaded successfully');
                            } catch (error) {
                              console.error('Error uploading files:', error);
                              toast.error('Failed to upload files. Please try again.');
                            } finally {
                              setIsUploading(false);
                              // Clear the file input
                              e.target.value = '';
                            }
                          }
                        }}
                        disabled={isUploading}
                      />
                      <button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUploading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        {isUploading ? 'Uploading...' : 'Upload Files'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-600 mb-3">
                  These items are files that customers will receive after purchasing your product. These can include:
                </p>
                <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
                  <li>PDF documents</li>
                  <li>eBooks</li>
                  <li>Software applications</li>
                  <li>Audio or video files</li>
                  <li>Design templates</li>
                  <li>Source code</li>
                </ul>
                <p className="text-gray-600">
                  The file you upload will be securely stored and only made available to customers after they complete their purchase.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <div className="mb-4 font-medium">Payment options</div>

              <div className="border rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Enable discount codes</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="offerCoupons" 
                      className="sr-only peer" 
                      checked={product.offerCoupons || false}
                      onChange={(e) => {
                        setProduct({
                          ...product,
                          offerCoupons: e.target.checked
                        })
                        
                        // Initialize discount codes from product if available
                        if (e.target.checked && product.discountCodes) {
                          try {
                            const parsedCodes = typeof product.discountCodes === 'string' 
                              ? JSON.parse(product.discountCodes) 
                              : product.discountCodes;
                            setDiscountCodes(parsedCodes || []);
                          } catch (err) {
                            console.error('Error parsing discount codes:', err);
                            setDiscountCodes([]);
                          }
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="text-gray-500 text-sm">
                  Allow customers to use discount codes during checkout.

                  {/* Edit Discount Code Modal */}
                  {editingDiscount.isEditing && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Discount Code</h2>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Discount Code</label>
                            <input 
                              type="text" 
                              value={editingDiscount.code.code}
                              onChange={(e) => setEditingDiscount({
                                ...editingDiscount, 
                                code: {...editingDiscount.code, code: e.target.value}
                              })}
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Discount Amount</label>
                            <input 
                              type="text" 
                              value={editingDiscount.code.amount}
                              onChange={(e) => {
                                const value = e.target.value
                                // Only allow integers (no decimals)
                                const integerRegex = /^\d*$/
                                if (value === '' || integerRegex.test(value)) {
                                  setEditingDiscount({
                                    ...editingDiscount, 
                                    code: {...editingDiscount.code, amount: value}
                                  })
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value
                                if (value !== '') {
                                  const validation = validateDiscountAmount(value, editingDiscount.code.type as 'percentage' | 'fixed')
                                  if (!validation.isValid) {
                                    alert(validation.error!) // Simple alert for now
                                  }
                                }
                              }}
                              className="w-full p-2 border rounded"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder={editingDiscount.code.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Discount Type</label>
                            <select 
                              value={editingDiscount.code.type}
                              onChange={(e) => setEditingDiscount({
                                ...editingDiscount, 
                                code: {...editingDiscount.code, type: e.target.value}
                              })}
                              className="w-full p-2 border rounded"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input 
                              type="date" 
                              value={editingDiscount.code.startDate}
                              onChange={(e) => setEditingDiscount({
                                ...editingDiscount, 
                                code: {...editingDiscount.code, startDate: e.target.value}
                              })}
                              className="w-full p-2 border rounded"
                              pattern="\d{4}-\d{2}-\d{2}"
                              placeholder="YYYY-MM-DD"
                              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                              onTouchEnd={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input 
                              type="date" 
                              value={editingDiscount.code.endDate}
                              onChange={(e) => setEditingDiscount({
                                ...editingDiscount, 
                                code: {...editingDiscount.code, endDate: e.target.value}
                              })}
                              className="w-full p-2 border rounded"
                              pattern="\d{4}-\d{2}-\d{2}"
                              placeholder="YYYY-MM-DD"
                              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                              onTouchEnd={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => setEditingDiscount({isEditing: false, index: -1, code: null})}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              // Validate before saving
                              const validation = validateDiscountAmount(editingDiscount.code.amount, editingDiscount.code.type as 'percentage' | 'fixed')
                              if (!validation.isValid) {
                                alert(validation.error!)
                                return;
                              }

                              // Update the discount code
                              const updatedCodes = [...discountCodes];
                              updatedCodes[editingDiscount.index] = editingDiscount.code;
                              setDiscountCodes(updatedCodes);
                              
                              // Update the product object to include the new discount codes
                              setProduct({
                                ...product,
                                discountCodes: JSON.stringify(updatedCodes)
                              });
                              
                              setEditingDiscount({isEditing: false, index: -1, code: null});
                              toast.success('Discount code updated successfully');
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Confirmation Modal */}
                  {deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-600">
                          Are you sure you want to delete the discount code 
                          <span className="font-semibold text-red-600"> {deleteConfirmation.code}</span>?
                        </p>
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => setDeleteConfirmation({ isOpen: false, code: '', index: -1 })}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                // Delete discount code from database
                                const response = await fetch(`/api/products/${unwrappedParams.id}/discount-codes`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    code: deleteConfirmation.code
                                  })
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to delete discount code');
                                }

                                // Remove from local state
                                const updatedCodes = [...discountCodes];
                                updatedCodes.splice(deleteConfirmation.index, 1);
                                setDiscountCodes(updatedCodes);
                                setDeleteConfirmation({ isOpen: false, code: '', index: -1 });

                                // Optional: Show success toast
                                toast.success('Discount code deleted successfully');
                              } catch (error) {
                                console.error('Error deleting discount code:', error);
                                toast.error('Failed to delete discount code');
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {product.offerCoupons && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-medium mb-3">Discount Codes</h3>
                    
                    {discountCodes.length > 0 && (
                      <div className="mb-4">
                        <div className="overflow-x-auto">
                          <div className="min-w-[800px]">
                            {/* Table Header */}
                            <div className="bg-gray-100 p-3 grid grid-cols-6 gap-2 font-medium text-sm sticky left-0">
                              <div className="min-w-[80px]">Actions</div>
                              <div className="min-w-[120px]">Code</div>
                              <div className="min-w-[100px]">Amount</div>
                              <div className="min-w-[100px]">Type</div>
                              <div className="min-w-[120px]">Start Date</div>
                              <div className="min-w-[120px]">End Date</div>
                            </div>
                            {/* Table Body */}
                            <div className="border border-t-0 rounded-b divide-y">
                              {discountCodes.map((code, index) => (
                            <div key={index} className="p-3 grid grid-cols-6 gap-2 items-center text-sm min-w-0">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => {
                                    setEditingDiscount({
                                      isEditing: true,
                                      index: index,
                                      code: {...code}
                                    });
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmation({
                                      isOpen: true,
                                      code: code.code,
                                      index: index
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                              </div>
                              <div className="truncate min-w-0" title={code.code}>{code.code}</div>
                              <div className="truncate">{code.amount}</div>
                              <div className="truncate">{code.type}</div>
                              <div className="truncate">{code.startDate}</div>
                              <div className="truncate">{code.endDate}</div>
                            </div>
                          ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded p-3 mb-3">
                      <h4 className="font-medium mb-2">Add New Discount Code</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Discount Code</label>
                          <input 
                            type="text" 
                            value={newDiscountCode.code}
                            onChange={(e) => setNewDiscountCode({...newDiscountCode, code: e.target.value})}
                            placeholder="e.g. SUMMER20" 
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Discount Amount</label>
                          <input 
                            type="text" 
                            value={newDiscountCode.amount}
                            onChange={(e) => {
                              const value = e.target.value
                              // Only allow integers (no decimals)
                              const integerRegex = /^\d*$/
                              if (value === '' || integerRegex.test(value)) {
                                setNewDiscountCode({...newDiscountCode, amount: value})
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value
                              if (value !== '') {
                                const validation = validateDiscountAmount(value, newDiscountCode.type as 'percentage' | 'fixed')
                                if (!validation.isValid) {
                                  alert(validation.error!) // Simple alert for now
                                }
                              }
                            }}
                            placeholder={newDiscountCode.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'} 
                            className="w-full p-2 border rounded"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Discount Type</label>
                          <select 
                            value={newDiscountCode.type}
                            onChange={(e) => setNewDiscountCode({...newDiscountCode, type: e.target.value})}
                            className="w-full p-2 border rounded"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <input 
                            type="date" 
                            value={newDiscountCode.startDate}
                            onChange={(e) => setNewDiscountCode({...newDiscountCode, startDate: e.target.value})}
                            className="w-full p-2 border rounded"
                            pattern="\d{4}-\d{2}-\d{2}"
                            placeholder="YYYY-MM-DD"
                            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                            onTouchEnd={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input 
                            type="date" 
                            value={newDiscountCode.endDate}
                            onChange={(e) => setNewDiscountCode({...newDiscountCode, endDate: e.target.value})}
                            className="w-full p-2 border rounded"
                            pattern="\d{4}-\d{2}-\d{2}"
                            placeholder="YYYY-MM-DD"
                            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                            onTouchEnd={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!newDiscountCode.code || !newDiscountCode.amount) {
                            alert('Please enter a discount code and amount');
                            return;
                          }

                          // Validate discount amount
                          const validation = validateDiscountAmount(newDiscountCode.amount, newDiscountCode.type as 'percentage' | 'fixed')
                          if (!validation.isValid) {
                            alert(validation.error!)
                            return;
                          }
                          
                          // Check for duplicate codes
                          if (discountCodes.some(code => code.code.toLowerCase() === newDiscountCode.code.toLowerCase())) {
                            alert('A discount code with this name already exists');
                            return;
                          }
                          
                          // Add the new discount code
                          const updatedCodes = [...discountCodes, newDiscountCode];
                          setDiscountCodes(updatedCodes);
                          
                          // Update the product object to include the new discount codes
                          setProduct({
                            ...product,
                            discountCodes: JSON.stringify(updatedCodes)
                          });
                          setNewDiscountCode({
                            code: '',
                            amount: '',
                            type: 'percentage',
                            startDate: '',
                            endDate: ''
                          });
                        }}
                        className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
                      >
                        Add Discount Code
                      </button>
                    </div>
                  </div>
                )}
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

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Product Settings</h2>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">Visibility</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="public" 
                      checked={formData.visibility === "public"} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            visibility: "public"
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span>Public</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="private" 
                      checked={formData.visibility === "private"} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            visibility: "private"
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span>Private</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">Public products can be viewed by anyone with the link.</p>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      status: e.target.value
                    });
                  }}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Active products are available for purchase.</p>
              </div>
            </div>

            <div className="border rounded-md p-6 bg-red-50">
              <h2 className="text-xl font-medium mb-4 text-red-600">Danger Zone</h2>
              <p className="mb-4 text-gray-700">Once you delete a product, there is no going back. Please be certain.</p>
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Product
              </button>
            </div>

            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-medium mb-4">Delete Product</h3>
                  <p className="mb-6">Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.</p>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 border rounded-md"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteProduct}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                          Deleting...
                        </>
                      ) : (
                        'Delete Product'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              {saveResult.success ? (
                <div className="bg-primary/10 text-primary p-3 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 text-red-700 p-3 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <h3 className="text-xl font-medium">
                {saveResult.success ? 'Success!' : 'Error'}
              </h3>
            </div>
            
            <p className="mb-6">{saveResult.message}</p>
            
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setShowSaveConfirmation(false);
                  if (saveResult.success) {
                    // Refresh product data if save was successful
                    const fetchProduct = async () => {
                      try {
                        const response = await fetch(`/api/products/${unwrappedParams.id}`);
                        if (response.ok) {
                          const updatedProduct = await response.json();
                          setProduct(updatedProduct);
                        }
                      } catch (error) {
                        console.error('Error fetching updated product:', error);
                      }
                    };
                    fetchProduct();
                  }
                }}
                className={`px-4 py-2 rounded-md ${saveResult.success ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
