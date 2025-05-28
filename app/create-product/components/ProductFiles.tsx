'use client'

import { useState, useEffect } from 'react'
import { Upload, X, File as FileIcon, Link as LinkIcon, Plus, Check, Loader2 } from 'lucide-react'
import { Product } from './ProductCreationForm'

type ProductFilesProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductFiles({ 
  productData, 
  setProductData 
}: ProductFilesProps) {
  const [dragActive, setDragActive] = useState(false)
  const [newLink, setNewLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize from productData if available
  useEffect(() => {
    if (productData.contentLinks && productData.contentLinks.length === 0) {
      setProductData({
        ...productData,
        contentLinks: []
      })
    }
  }, [])

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setProductData({
        ...productData,
        contentFiles: [...productData.contentFiles, ...newFiles]
      })
      setError(null)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setProductData({
        ...productData,
        contentFiles: [...productData.contentFiles, ...newFiles]
      })
      setError(null)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...productData.contentFiles]
    updatedFiles.splice(index, 1)
    setProductData({
      ...productData,
      contentFiles: updatedFiles
    })
  }

  // Handle adding a content link
  const handleAddLink = () => {
    if (!newLink) return
    
    // Validate URL
    try {
      new URL(newLink)
    } catch (e) {
      setError('Please enter a valid URL')
      return
    }
    
    setProductData({
      ...productData,
      contentLinks: [...(productData.contentLinks || []), newLink]
    })
    setNewLink('')
    setError(null)
  }

  // Handle removing a content link
  const handleRemoveLink = (index: number) => {
    const updatedLinks = [...(productData.contentLinks || [])]
    updatedLinks.splice(index, 1)
    setProductData({
      ...productData,
      contentLinks: updatedLinks
    })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
    else return (bytes / 1048576).toFixed(2) + ' MB'
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="tracking-tight text-xl font-light text-stone-900">Digital Files</h3>
        <p className="text-sm text-gray-500 mb-4">Upload files customers will download after purchase</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md flex items-center">
          <X size={16} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check size={16} className="mr-2 flex-shrink-0" />
          <span>Files added successfully!</span>
        </div>
      )}

      {/* File upload area */}
      <div 
        className={`border-2 border-dashed ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'} rounded-xl p-6 text-center mb-6`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`${dragActive ? 'bg-emerald-100' : 'bg-stone-100'} p-3 rounded-full mb-3`}>
            <Upload className="w-6 h-6 text-stone-500" />
          </div>
          <p className="text-sm font-light mb-1">
            {dragActive ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-gray-500 mb-4 font-light">or click to browse</p>
          <button 
            className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-md hover:bg-emerald-600"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Select Files
          </button>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.jpg,.jpeg,.png,.gif"
          />
        </div>
      </div>
      
      {/* File list */}
      {productData.contentFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-light mb-2">Uploaded Files</h3>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <ul className="divide-y">
              {productData.contentFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <FileIcon size={16} className="text-stone-500 mr-2" />
                    <div>
                      <p className="text-sm font-light">{file.name}</p>
                      <p className="text-xs text-gray-500 font-light">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-light">
            {productData.contentFiles.length === 1 
              ? '1 file selected' 
              : `${productData.contentFiles.length} files selected`}
          </p>
        </div>
      )}

      {/* Content Links */}
      <div className="mb-6">
        {productData.contentLinks && productData.contentLinks.length > 0 && (
          <div className="border rounded-md">
            <ul className="divide-y">
              {productData.contentLinks.map((link, index) => (
                <li key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <LinkIcon size={16} className="text-stone-500 mr-2" />
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline font-light"
                    >
                      {link}
                    </a>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Digital product specific information */}
      <div className="mt-6 p-4 bg-stone-50 rounded-md border border-stone-200">
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4 font-light">
          <li>Maximum 10 files per product</li>
          <li>Maximum file size: 100MB each</li>
          <li>Supported formats: PDF, ZIP, MP3, MP4, and most common file types</li>
          <li>Files are securely stored and only available after purchase</li>
        </ul>
      </div>
    </div>
  )
}
