"use client"

import { useState } from "react"
import { Upload, X, Link as LinkIcon, File, Plus, ChevronLeft } from "lucide-react"
import Link from "next/link"

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
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
      
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

  const handleSubmit = () => {
    if (files.length === 0 && links.length === 0) {
      setError("Please add at least one file or link")
      return
    }
    
    onNext()
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
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            Save and continue
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-medium mb-2">Product Content</h2>
        <p className="text-gray-600 mb-6">
          Add the content that will be sent to the user upon purchase. This is what they are buying. You can upload files or add external links.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Upload Files</h2>
          <div className="border-2 border-dashed rounded-md p-6 text-center mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="content-upload"
            />
            <label
              htmlFor="content-upload"
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md"
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
                      <span className="text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
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
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Add External Links</h2>
          <div className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="flex-1 p-3 border rounded-l-md"
                placeholder="https://example.com/download"
              />
              <button
                onClick={handleAddLink}
                className="px-4 py-2 bg-black text-white rounded-r-md"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {links.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Added Links</h3>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <LinkIcon size={16} className="mr-2 text-gray-500" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-xs">
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


      </div>
    </div>
  )
}
