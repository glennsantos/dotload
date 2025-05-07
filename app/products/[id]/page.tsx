"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Edit, BarChart2, Share2, ExternalLink, ChevronRight } from "lucide-react"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("product")

  // This would normally be fetched from an API
  const product = {
    id: params.id,
    name: "Solo Travel to Japan in Your 20s: A Comprehensive Guide",
    type: "ebook",
    price: "2.99",
    description:
      "A complete guide for solo travelers visiting Japan in their 20s. Includes budget tips, itineraries, and cultural insights.",
    coverImage: "/placeholder.svg?key=dvrti",
    sales: 0,
    views: 12,
    conversionRate: "0%",
    publishedAt: "May 7, 2025",
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
          <button className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2">
            <Share2 size={18} /> Share
          </button>
        </div>
      </header>

      <div className="border-b">
        <div className="flex">
          <button
            className={`px-6 py-3 ${activeTab === "product" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("product")}
          >
            Product
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "analytics" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button
            className={`px-6 py-3 ${activeTab === "settings" ? "border-b-2 border-black" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
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
                      <div className="font-medium">${product.price}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Published</div>
                      <div className="font-medium">{product.publishedAt}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <p>{product.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-medium mb-4">Files</h2>
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between p-2 border rounded mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded">
                        <span className="text-blue-800">PDF</span>
                      </div>
                      <span>japan-travel-guide.pdf</span>
                    </div>
                    <div className="text-sm text-gray-500">2.4 MB</div>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-2 rounded">
                        <span className="text-green-800">EPUB</span>
                      </div>
                      <span>japan-travel-guide.epub</span>
                    </div>
                    <div className="text-sm text-gray-500">1.8 MB</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium mb-4">Preview</h2>
              <div className="border rounded-md overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-2">{product.name}</h3>
                  <Image
                    src={product.coverImage || "/placeholder.svg"}
                    alt="Product cover"
                    width={300}
                    height={400}
                    className="w-full h-auto mb-4 rounded"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-purple-200 text-sm px-2 py-1 rounded">${product.price}</div>
                    <div className="text-sm text-gray-500">0 ratings</div>
                  </div>
                  <Link
                    href={`https://alacarte.com/l/${params.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 w-full p-2 border rounded-md text-sm hover:bg-gray-50"
                  >
                    View Live <ExternalLink size={14} />
                  </Link>
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
                  <div className="text-3xl font-medium">{product.sales}</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-1">Views</div>
                  <div className="text-3xl font-medium">{product.views}</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
                  <div className="text-3xl font-medium">{product.conversionRate}</div>
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

        {activeTab === "settings" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Product Settings</h2>
              <div className="border rounded-md p-6 space-y-6">
                <div>
                  <label className="block mb-2 font-medium">Product URL</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`https://alacarte.com/l/${params.id}`}
                      readOnly
                      className="flex-1 p-3 border rounded-l-md bg-gray-100"
                    />
                    <button className="px-4 py-2 bg-black text-white rounded-r-md">Copy</button>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium">Visibility</label>
                  <select className="w-full p-3 border rounded-md">
                    <option>Public</option>
                    <option>Unlisted</option>
                    <option>Password Protected</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium">Product Status</label>
                  <select className="w-full p-3 border rounded-md">
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Archived</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <button className="px-4 py-2 bg-red-500 text-white rounded-md">Delete Product</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
