"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UploadDigitalItem({ productId }: { productId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("digitalItem", file)

      const response = await fetch(`/api/products/${productId}/digital-item`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to upload digital item")
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

      <h1 className="text-2xl font-bold mb-6">Upload Digital Item</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Item File
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isUploading || uploadSuccess}
            />
          </div>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <X size={16} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadSuccess ? (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
            <Check size={16} className="mr-2 flex-shrink-0" />
            <span>Digital item uploaded successfully!</span>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !file || isUploading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload Digital Item
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium mb-4">About Digital Items</h2>
        <p className="text-gray-600 mb-3">
          Digital items are files that customers will receive after purchasing your product. These can include:
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
          The file you upload will be securely stored and only made available to customers after they complete their purchase.
        </p>
      </div>
    </div>
  )
}
