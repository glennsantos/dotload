"use client"

import type React from "react"

import { useState } from "react"
import { X, Upload, Plus, Trash2, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ProductCustomization({
  productData,
  setProductData,
  onNext,
  onCancel,
}: {
  productData: any
  setProductData: (data: any) => void
  onNext: () => void
  onCancel: () => void
}) {
  const [activeTab, setActiveTab] = useState("product")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setPreviewImage(event.target.result as string)
          // In a real app, you would upload the file to a server here
          setUploadedFiles([...uploadedFiles, file.name])
        }
      }

      reader.readAsDataURL(file)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProductData({
      ...productData,
      description: e.target.value,
    })
  }

  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Customize Product</span>
        </div>
      </div>

      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
        </h1>
        <div className="flex gap-2">
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
          <div className="border-b">
            <div className="flex">
              <button
                className={`px-6 py-3 ${activeTab === "product" ? "border-b-2 border-black" : ""}`}
                onClick={() => setActiveTab("product")}
              >
                Product
              </button>
              <button
                className={`px-6 py-3 ${activeTab === "content" ? "border-b-2 border-black" : ""}`}
                onClick={() => setActiveTab("content")}
              >
                Content
              </button>
              <button
                className={`px-6 py-3 ${activeTab === "checkout" ? "border-b-2 border-black" : ""}`}
                onClick={() => setActiveTab("checkout")}
              >
                Checkout
              </button>
              <button
                className={`px-6 py-3 ${activeTab === "share" ? "border-b-2 border-black" : ""}`}
                onClick={() => setActiveTab("share")}
              >
                Share
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "product" && (
              <div>
                <div className="mb-6">
                  <label className="block mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    value={productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    className="w-full p-3 border rounded-md"
                  />
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-medium">Description</label>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-black text-white p-2 flex gap-2">
                      <button className="p-1 rounded hover:bg-gray-800">
                        <strong className="font-bold">B</strong>
                      </button>
                      <button className="p-1 rounded hover:bg-gray-800">
                        <em className="italic">I</em>
                      </button>
                      <button className="p-1 rounded hover:bg-gray-800">
                        <u>U</u>
                      </button>
                      <button className="p-1 rounded hover:bg-gray-800">
                        <s>S</s>
                      </button>
                      <button className="p-1 rounded hover:bg-gray-800">&lt;&gt;</button>
                      <button className="p-1 rounded hover:bg-gray-800">Tt</button>
                      <button className="p-1 rounded hover:bg-gray-800">•</button>
                      <button className="p-1 rounded hover:bg-gray-800">1.</button>
                      <button className="p-1 rounded hover:bg-gray-800">=</button>
                      <button className="p-1 rounded hover:bg-gray-800">"</button>
                      <button className="p-1 rounded hover:bg-gray-800">🔗</button>
                      <button className="p-1 rounded hover:bg-gray-800">📷</button>
                      <button className="p-1 rounded hover:bg-gray-800">📊</button>
                      <button className="p-1 rounded hover:bg-gray-800">🐦</button>
                      <button className="p-1 rounded hover:bg-gray-800">✨</button>
                    </div>
                    <textarea
                      value={productData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe your product..."
                      className="w-full p-4 min-h-[200px] focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-medium">URL</label>
                  <div className="flex">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value="9637988267579.alacarte.com//"
                        readOnly
                        className="w-full p-3 border rounded-l-md bg-gray-100"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Custom URL slug"
                      className="flex-1 p-3 border-l-0 border rounded-r-md"
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <button className="text-gray-600 hover:text-black">Copy URL</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "content" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Cover Image</h2>
                  <div className="border-2 border-dashed rounded-md p-8 text-center">
                    {previewImage ? (
                      <div className="relative">
                        <Image
                          src={previewImage || "/placeholder.svg"}
                          alt="Cover preview"
                          width={400}
                          height={300}
                          className="mx-auto max-h-[300px] object-contain"
                        />
                        <button
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          onClick={() => setPreviewImage(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2" size={48} />
                        <p className="mb-4">Drag and drop or click to upload</p>
                        <p className="text-sm text-gray-500 mb-4">Recommended size: 1280 x 720px</p>
                        <label className="bg-black text-white px-4 py-2 rounded-md cursor-pointer">
                          Upload Cover Image
                          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Product Files</h2>
                  <div className="border-2 border-dashed rounded-md p-8 text-center">
                    {uploadedFiles.length > 0 ? (
                      <div>
                        <h3 className="font-medium mb-4">Uploaded Files</h3>
                        <ul className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between p-2 border rounded">
                              <span>{file}</span>
                              <button
                                className="text-red-500"
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button className="mt-4 flex items-center gap-2 text-blue-600">
                          <Plus size={16} /> Add More Files
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2" size={48} />
                        <p className="mb-4">Drag and drop or click to upload your product files</p>
                        <p className="text-sm text-gray-500 mb-4">PDF, EPUB, MOBI, MP3, MP4, ZIP, etc.</p>
                        <label className="bg-black text-white px-4 py-2 rounded-md cursor-pointer">
                          Upload Files
                          <input type="file" className="hidden" multiple />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "checkout" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Checkout Options</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">Pay what you want</h3>
                        <p className="text-sm text-gray-600">Allow customers to pay more than your set price</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">Offer coupons</h3>
                        <p className="text-sm text-gray-600">Create discount codes for your product</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">Subscription billing</h3>
                        <p className="text-sm text-gray-600">Charge customers on a recurring basis</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Payment Methods</h2>

                  <div className="p-4 border rounded-md mb-4">
                    <h3 className="font-medium mb-2">Credit Card</h3>
                    <p className="text-sm text-gray-600 mb-4">Accept payments via credit card (enabled by default)</p>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="font-medium">Visa</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="font-medium">Mastercard</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="font-medium">Amex</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <span className="font-medium">Discover</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">PayPal</h3>
                      <button className="text-blue-600">Connect</button>
                    </div>
                    <p className="text-sm text-gray-600">Connect your PayPal account to accept payments</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "share" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Share Your Product</h2>

                  <div className="p-4 border rounded-md mb-4">
                    <h3 className="font-medium mb-2">Product URL</h3>
                    <div className="flex mb-4">
                      <input
                        type="text"
                        value="https://9637988267579.alacarte.com/l/japan-travel-guide"
                        readOnly
                        className="flex-1 p-3 border rounded-l-md bg-gray-100"
                      />
                      <button className="px-4 py-2 bg-black text-white rounded-r-md">Copy</button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md mb-4">
                    <h3 className="font-medium mb-2">Social Media</h3>
                    <p className="text-sm text-gray-600 mb-4">Share your product on social media</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Twitter</button>
                      <button className="px-4 py-2 bg-blue-800 text-white rounded-md">Facebook</button>
                      <button className="px-4 py-2 bg-pink-600 text-white rounded-md">Instagram</button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Embed on Website</h3>
                    <p className="text-sm text-gray-600 mb-4">Add this product to your website</p>
                    <div className="bg-gray-100 p-3 rounded-md">
                      <code className="text-sm">
                        &lt;iframe src="https://9637988267579.alacarte.com/l/japan-travel-guide/embed" frameborder="0"
                        width="100%" height="auto" style="min-height: 400px;"&gt;&lt;/iframe&gt;
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/3 p-6">
          <h2 className="text-xl font-medium mb-4">Preview</h2>
          <div className="border rounded-md overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">
                {productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
              </h3>
              {previewImage ? (
                <Image
                  src={previewImage || "/placeholder.svg"}
                  alt="Cover preview"
                  width={400}
                  height={300}
                  className="w-full h-auto mb-4 rounded"
                />
              ) : (
                <div className="bg-gray-200 w-full h-48 mb-4 rounded flex items-center justify-center text-gray-400">
                  No cover image
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="bg-purple-200 text-sm px-2 py-1 rounded">${productData.price || "2.99"}</div>
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
