"use client"

import { useState, useEffect } from "react"
import { Upload, X, Link as LinkIcon, File, Plus, ChevronLeft, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ContentUpload({
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
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  // Initialize from productData if available
  useEffect(() => {
    if (productData.contentFiles && productData.contentFiles.length > 0) {
      setFiles(productData.contentFiles)
    }
    if (productData.contentLinks && productData.contentLinks.length > 0) {
      setLinks(productData.contentLinks)
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
      setError(null)
      
      // Update product data with files
      setProductData({
        ...productData,
        contentFiles: [...(productData.contentFiles || []), ...newFiles]
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    setFiles(updatedFiles)
    
    // Update product data
    const updatedContentFiles = [...(productData.contentFiles || [])]
    updatedContentFiles.splice(index, 1)
    setProductData({
      ...productData,
      contentFiles: updatedContentFiles
    })
  }

  const handleAddLink = () => {
    if (!newLink) return
    
    // Validate URL
    try {
      new URL(newLink)
    } catch (e) {
      setError("Please enter a valid URL")
      return
    }
    
    setLinks([...links, newLink])
    setNewLink("")
    setError(null)
    
    // Update product data
    setProductData({
      ...productData,
      contentLinks: [...(productData.contentLinks || []), newLink]
    })
  }

  const handleRemoveLink = (index: number) => {
    const updatedLinks = [...links]
    updatedLinks.splice(index, 1)
    setLinks(updatedLinks)
    
    // Update product data
    const updatedContentLinks = [...(productData.contentLinks || [])]
    updatedContentLinks.splice(index, 1)
    setProductData({
      ...productData,
      contentLinks: updatedContentLinks
    })
  }

  const handleSubmit = async () => {
    if (files.length === 0 && links.length === 0) {
      setError("Please add at least one file or link")
      return
    }
    
    setIsSubmitting(true)
    try {
      await onNext()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name || "New Product"}
        </h1>
        <div className="flex gap-2 hidden sm:flex">
          <button onClick={onBack} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || uploadSuccess}
            className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {uploadSuccess ? 'Content Added!' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-medium mb-2">Product Content</h2>
        <p className="text-gray-600 mb-6">
          Add the content that will be sent to the user upon purchase.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md flex items-center">
            <X size={16} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
            <Check size={16} className="mr-2 flex-shrink-0" />
            <span>Digital content added successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Upload Files</h2>
            <div className="border-2 border-dashed rounded-md p-6 text-center mb-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="content-upload"
                disabled={isSubmitting || uploadSuccess}
              />
              <label
                htmlFor="content-upload"
                className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-md ${isSubmitting || uploadSuccess ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-black-700 text-white'}`}
              >
                <Upload size={16} className="mr-2" /> Choose Files
              </label>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop files here
              </p>
            </div>

            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Uploaded Files</h3>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <File size={16} className="mr-2 text-gray-500" />
                        <span className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">About Digital Content</h2>
          <p className="text-gray-600 mb-3">
            Digital content are files that customers will receive after purchasing your product. These can include:
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
            The files you upload will be securely stored and only made available to customers after they complete their purchase.
          </p>
        </div>
      </div>
    </div>
  )
}
