"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Check, X, ArrowLeft, File, Plus, LinkIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { ALLOWED_EXTENSIONS_FOR_HTML_ACCEPT, isAllowedDigitalFile } from '@/lib/file-validation'

export default function UploadDigitalItem({ productId }: { productId: string }) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      
      // Check for invalid file types
      const invalidFiles = newFiles.filter(file => !isAllowedDigitalFile(file.name, file.type))
      
      if (invalidFiles.length > 0) {
        setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Please upload only allowed file types.`)
        return
      }
      
      setFiles([...files, ...newFiles])
      setError(null)
    }
  }
  
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    setFiles(updatedFiles)
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
  }
  
  const handleRemoveLink = (index: number) => {
    const updatedLinks = [...links]
    updatedLinks.splice(index, 1)
    setLinks(updatedLinks)
  }

  const handleUpload = async () => {
    if (files.length === 0 && links.length === 0) {
      setError("Please select at least one file to upload or add a link")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Upload files first
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData()
          formData.append("digitalItem", file)

          const response = await fetch(`/api/products/${productId}/digital-item`, {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.details || `Failed to upload digital item: ${file.name}`)
          }
        }
      }
      
      // Upload links if we have any
      if (links.length > 0) {
        const response = await fetch(`/api/products/${productId}/external-links`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ links }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || "Failed to save external links")
        }
      }

      setUploadSuccess(true)
      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Digital item upload error:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 flex items-center">
        <Link href={`/products/${productId}`} className="flex items-center text-gray-600 hover:text-black">
          <ArrowLeft size={16} className="mr-2" />
          Back to Product
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Upload Digital Content</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <X size={16} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check size={16} className="mr-2 flex-shrink-0" />
          <span>Digital content uploaded successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Upload Files</h2>
          <div className="border-2 border-dashed rounded-md p-6 text-center mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="content-upload"
              disabled={isUploading || uploadSuccess}
              accept={ALLOWED_EXTENSIONS_FOR_HTML_ACCEPT}
            />
            <label
              htmlFor="content-upload"
              className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-md ${isUploading || uploadSuccess ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!uploadSuccess && (
          <button
            onClick={handleUpload}
            disabled={files.length === 0 && links.length === 0 || isUploading}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              files.length === 0 && links.length === 0 || isUploading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload Digital Content
              </>
            )}
          </button>
        )}
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
  )
}
