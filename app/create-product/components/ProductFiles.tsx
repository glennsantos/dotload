'use client'

import { useState } from 'react'
import { Upload, X, File as FileIcon } from 'lucide-react'
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
    else return (bytes / 1048576).toFixed(2) + ' MB'
  }

  return (
    <div>
      {/* File upload area */}
      <div 
        className={`border-2 border-dashed ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'} rounded-lg p-6 text-center`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`${dragActive ? 'bg-emerald-100' : 'bg-gray-100'} p-3 rounded-full mb-3`}>
            <Upload className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-sm font-medium mb-1">
            {dragActive ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-gray-500 mb-4">or click to browse</p>
          <button 
            className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800"
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
          />
        </div>
        
        {/* File list */}
        {productData.contentFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Selected Files:</p>
            <div className="max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {productData.contentFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <FileIcon size={16} className="text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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
            <p className="text-xs text-gray-500 mt-2">
              {productData.contentFiles.length === 1 
                ? '1 file selected' 
                : `${productData.contentFiles.length} files selected`}
            </p>
          </div>
        )}
      </div>

      {/* Digital product specific information */}
      {productData.type === 'digital_product' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">Digital Product Information</h3>
          <p className="text-xs text-gray-500 mb-4">
            Your customers will be able to download these files after purchase. 
            The first file will be considered the main downloadable file.
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            <li>Maximum 10 files per product</li>
            <li>Maximum file size: 100MB each</li>
            <li>Supported formats: PDF, ZIP, MP3, MP4, and most common file types</li>
          </ul>
        </div>
      )}
    </div>
  )
}
