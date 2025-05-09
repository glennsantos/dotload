"use client"

import { useState } from "react"
import { X, Calendar, Globe, Lock, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function PublishProduct({
  productData,
  onPublish,
  onBack,
  onCancel,
  isSubmitting = false,
}: {
  productData: any
  onPublish: () => void
  onBack: () => void
  onCancel: () => void
  isSubmitting?: boolean
}) {
  // Product is always published immediately and set to public visibility

  return (
    <div>
      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name}
        </h1>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 border rounded-md flex items-center gap-2">
            Back
          </button>
          <button onClick={onCancel} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <X size={18} /> Cancel
          </button>
          <button 
            onClick={onPublish} 
            disabled={isSubmitting}
            className={`px-4 py-2 bg-black text-white rounded-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4">Publish Settings</h2>
          <p className="text-gray-600 mb-6">Configure when and how your product will be available.</p>

          <div className="space-y-6">
            {/* SEO section removed as requested */}
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={onPublish} 
            disabled={isSubmitting}
            className={`px-6 py-3 bg-black text-white rounded-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
