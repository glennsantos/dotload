"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, ChevronLeft } from "lucide-react"
import NextImage from "next/image"

export default function ProductCustomization({
  productData,
  setProductData,
  onNext,
  onBack,
  onCancel,
}: {
  productData: any
  setProductData: (data: any) => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}) {
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setProductData({
        ...productData,
        coverImage: file,
      })
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setCoverImagePreview(previewUrl)
    }
  }

  const handleRemoveCoverImage = () => {
    setProductData({
      ...productData,
      coverImage: null,
    })
    setCoverImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDescriptionChange = (content: string) => {
    setProductData({
      ...productData,
      description: content
    })
  }

  return (
    <div>
      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name || "New Product"}
        </h1>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={onCancel} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <X size={18} /> Cancel
          </button>
          <button onClick={onNext} className="px-4 py-2 bg-black text-white rounded-md">
            Save and continue
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-2/3 border-r">

          <div className="p-6">
            <div>
              <div className="mb-6">
                <label className="block mb-2 font-medium">Name</label>
                <input
                  type="text"
                  value={productData.name || ""}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  className="w-full p-3 border rounded-md"
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">Slug</label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">{window.location.origin}/p/</span>
                  <input
                    type="text"
                    value={productData.slug || ""}
                    onChange={(e) => setProductData({ ...productData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() })}
                    className="flex-1 p-3 border rounded-md"
                    placeholder="your-product-slug"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This will be the URL for your product page</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">Description</label>
                <Editor
                  apiKey="no-api-key"
                  initialValue={productData.description || ""}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                  }}
                  onEditorChange={handleDescriptionChange}
                />
                <p className="text-xs text-gray-500 mt-1">Use the rich text editor to format your product description</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">Cover Image</label>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  {coverImagePreview ? (
                    <div className="relative">
                      <div className="relative w-full h-48 mt-4">
                        <NextImage 
                          src={coverImagePreview} 
                          alt="Cover Preview" 
                          fill 
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        className="hidden"
                        ref={fileInputRef}
                        id="cover-image-upload"
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md"
                      >
                        <Upload size={16} className="mr-2" /> Upload Image
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        Recommended size: 1200 x 630 pixels
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3 p-6">
          <h2 className="text-xl font-medium mb-4">Preview</h2>
          <div className="border rounded-md overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">
                {productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
              </h3>
              <div className="bg-gray-200 w-full h-48 mb-4 rounded flex items-center justify-center text-gray-400">
                Preview will be generated after submission
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="bg-purple-200 text-sm px-2 py-1 rounded">₱{productData.price || "2.99"}</div>
                <div className="text-sm text-gray-500">0 ratings</div>
              </div>
              <div className="bg-yellow-100 text-sm p-2 rounded mb-4">This product is not currently for sale</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
