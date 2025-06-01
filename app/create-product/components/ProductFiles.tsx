'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Product } from './ProductCreationForm'
import { Trash, Upload, X, Link as LinkIcon, Plus, FileText, Check, Loader2, File as FileIcon, Download } from 'lucide-react'
import ErrorModal from '@/app/components/ErrorModal'
import SuccessModal from '@/app/components/SuccessModal'

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

type ProductFilesProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductFiles({ 
  productData, 
  setProductData 
}: {
  productData: Product
  setProductData: React.Dispatch<React.SetStateAction<Product>>
}) {
  const [dragActive, setDragActive] = useState(false)
  const [newLink, setNewLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successModalMessage, setSuccessModalMessage] = useState('')

  const showError = (message: string) => {
    setErrorModalMessage(message)
    setErrorModalOpen(true)
  }

  const showSuccess = (message: string) => {
    setSuccessModalMessage(message)
    setSuccessModalOpen(true)
  }

  // Initialize existingFiles if it doesn't exist
  React.useEffect(() => {
    if (!productData.existingFiles) {
      setProductData(prev => ({ ...prev, existingFiles: [] }));
    }
  }, [productData.existingFiles, setProductData]);

  // Initialize from productData if available
  useEffect(() => {
    // Ensure contentLinks is always an array
    if (!productData.contentLinks || !Array.isArray(productData.contentLinks)) {
      setProductData(prev => ({
        ...prev,
        contentLinks: []
      }))
    }
  }, [productData.contentLinks, setProductData])

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
      
      // Check for files that exceed the maximum size
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE)
      
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ')
        showError(`The following files exceed the maximum size of 50MB: ${fileNames}`)
        return
      }
      
      setProductData({
        ...productData,
        contentFiles: [...productData.contentFiles, ...newFiles]
      })
      setError(null)
      showSuccess('Files added successfully!')
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      
      // Check for files that exceed the maximum size
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE)
      
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ')
        showError(`The following files exceed the maximum size of 50MB: ${fileNames}`)
        return
      }
      
      setProductData({
        ...productData,
        contentFiles: [...productData.contentFiles, ...newFiles]
      })
      setError(null)
      showSuccess('Files added successfully!')
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
      showError('Please enter a valid URL')
      return
    }
    
    // Ensure contentLinks is an array before spreading
    const currentLinks = Array.isArray(productData.contentLinks) ? productData.contentLinks : []
    
    setProductData({
      ...productData,
      contentLinks: [...currentLinks, newLink]
    })
    setNewLink('')
    setError(null)
  }

  // Handle removing a content link
  const handleRemoveLink = (index: number) => {
    // Ensure contentLinks is an array before operating on it
    const currentLinks = Array.isArray(productData.contentLinks) ? productData.contentLinks : []
    const updatedLinks = [...currentLinks]
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
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Upload Error"
        message={errorModalMessage}
      />
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Upload Success"
        message={successModalMessage}
      />

      <div className="mb-6">
        <h3 className="tracking-tight text-xl font-light text-stone-900">Digital Files</h3>
        <p className="text-sm text-gray-500 mb-4">Upload files customers will download after purchase</p>
      </div>

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
      {(productData.contentFiles.length > 0 || (productData.existingFiles && productData.existingFiles.length > 0)) && (
        <div className="mb-6">
          <h3 className="text-base font-light mb-2">Uploaded Files</h3>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <ul className="divide-y">
              {/* Display existing files */}
              {productData.existingFiles && productData.existingFiles.length > 0 && productData.existingFiles.map((file, index) => (
                <li key={`existing-${index}`} className="flex items-center justify-between p-3 bg-stone-50">
                  <div className="flex items-center">
                    <FileIcon size={16} className="text-stone-500 mr-2" />
                    <div>
                      <button 
                        onClick={() => {
                          try {
                            // Use the direct download endpoint
                            window.open(`/api/downloads/file/${file.id}`, '_blank', 'noopener,noreferrer');
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            showError('Failed to download file. Please try again.');
                          }
                        }}
                        className="text-sm font-light text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        {file.name}
                        <Download size={14} className="ml-2 inline" />
                      </button>
                      <p className="text-xs text-stone-600 font-light">Already uploaded</p>
                    </div>
                  </div>
                </li>
              ))}
              
              
              {/* Display newly added files */}
              {productData.contentFiles.map((file, index) => (
                <li key={`new-${index}`} className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <FileIcon size={16} className="text-stone-500 mr-2" />
                    <div>
                      {/* File objects don't have URL property, so we just display the name */}
                      <p className="text-sm font-light">{file.name}</p>
                      <p className="text-xs text-gray-500 font-light">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-blue-600 font-light">New upload</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-light">
            {(productData.contentFiles.length + (productData.existingFiles ? productData.existingFiles.length : 0)) === 1 
              ? '1 file selected' 
              : `${productData.contentFiles.length + (productData.existingFiles ? productData.existingFiles.length : 0)} files selected`}
          </p>
        </div>
      )}

      {/* Content Links */}
      <div className="mb-6">
        {Array.isArray(productData.contentLinks) && productData.contentLinks.length > 0 && (
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
