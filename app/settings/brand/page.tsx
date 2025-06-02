"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, StoreIcon } from "lucide-react"

export default function BrandSettingsPage() {
  const [brandName, setBrandName] = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [headerPreview, setHeaderPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch brand settings on component mount
  useEffect(() => {
    const fetchBrandSettings = async () => {
      try {
        const response = await fetch('/api/user/settings', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setBrandName(data.storeName || '')
          setBrandDescription(data.storeDescription || '')
          if (data.logoUrl) setLogoPreview(data.logoUrl)
          if (data.headerUrl) setHeaderPreview(data.headerUrl)
        }
      } catch (error) {
        console.error('Error fetching brand settings:', error)
      }
    }
    
    fetchBrandSettings()
  }, [])
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: "error", text: "Logo must be JPG, PNG, or WebP format" })
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo must be less than 2MB" })
      return
    }
    
    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // Handle header image file selection
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: "error", text: "Header image must be JPG, PNG, or WebP format" })
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Header image must be less than 2MB" })
      return
    }
    
    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (event) => {
      setHeaderPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })
    setIsLoading(true)
    
    try {
      // Create form data object
      const formData = new FormData()
      formData.append('storeName', brandName)
      formData.append('storeDescription', brandDescription)
      
      // Get the actual File objects from the refs
      const logoFile = logoInputRef.current?.files?.[0]
      const headerFile = headerInputRef.current?.files?.[0]
      
      // Only append files if they are new uploads
      if (logoFile) {
        formData.append('logoFile', logoFile)
      }
      
      if (headerFile) {
        formData.append('headerFile', headerFile)
      }
      
      // Send the form data to the API
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary for FormData
        credentials: 'include'
      })
      
      if (response.ok) {
        setMessage({ type: "success", text: "Brand settings updated successfully" })
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.message || "Failed to update brand settings" })
      }
    } catch (error) {
      console.error('Error updating brand settings:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
     
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        {message.text && (
          <div className={`p-4 mb-4 rounded-md ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="brand-name" className="block text-sm font-light text-stone-700 mb-1">
              Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your brand name"
            />
          </div>
          
          <div>
            <label htmlFor="brand-description" className="block text-sm font-light text-stone-700 mb-1">
              Brand Description
            </label>
            <textarea
              id="brand-description"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
              rows={5}
              placeholder="Describe your brand..."
              maxLength={500}
            ></textarea>
            <p className="text-xs text-stone-500 mt-1">
              {brandDescription.length}/500 characters
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-light text-stone-700 mb-4 flex items-center">
              <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
              Brand Images
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="brand-logo" className="block text-sm font-light text-stone-700 mb-2">
                  Brand Logo
                </label>
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 flex flex-col items-center justify-center h-48">
                  {logoPreview ? (
                    <div 
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (logoInputRef.current) logoInputRef.current.click()
                      }}
                    >
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                        title="Click to change logo"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (logoInputRef.current) logoInputRef.current.click()
                        }}
                        className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-stone-100"
                      >
                        <Upload size={16} className="text-stone-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (logoInputRef.current) logoInputRef.current.click()
                      }}
                      className="flex flex-col items-center justify-center text-stone-500 hover:text-stone-700"
                    >
                      <Upload size={24} className="mb-2" />
                      <span className="text-sm font-medium">Upload Logo</span>
                    </button>
                  )}
                  <input
                    type="file"
                    id="brand-logo"
                    name="logoFile"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  JPG, PNG, WebP (max 2MB)<br />
                  Recommended: 400x400px
                </p>
              </div>
              
              <div>
                <label htmlFor="header-image" className="block text-sm font-light text-stone-700 mb-2">
                  Header Image
                </label>
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 flex flex-col items-center justify-center h-48">
                  {headerPreview ? (
                    <div 
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (headerInputRef.current) headerInputRef.current.click()
                      }}
                    >
                      <img
                        src={headerPreview}
                        alt="Header image preview"
                        className="max-h-full max-w-full object-contain"
                        title="Click to change header image"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (headerInputRef.current) headerInputRef.current.click()
                        }}
                        className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-stone-100"
                      >
                        <Upload size={16} className="text-stone-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (headerInputRef.current) headerInputRef.current.click()
                      }}
                      className="flex flex-col items-center justify-center text-stone-500 hover:text-stone-700"
                    >
                      <Upload size={24} className="mb-2" />
                      <span className="text-sm font-medium">Upload Header</span>
                    </button>
                  )}
                  <input
                    type="file"
                    id="header-image"
                    name="headerFile"
                    ref={headerInputRef}
                    onChange={handleHeaderChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  JPG, PNG, WebP (max 2MB)<br />
                  Recommended: 1200x400px
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              Update Brand Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
