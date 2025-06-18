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
      <div className="claude-card p-6">
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg border ${message.type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`}>
            {message.text}
          </div>
        )}
        
        <div className="flex items-center mb-6">
          <div className="bg-primary/10 p-2 rounded-2xl mr-3">
            <StoreIcon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-light text-foreground">Brand Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="brand-name" className="block text-sm font-light text-foreground mb-2">
              Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your brand name"
            />
          </div>
          
          <div>
            <label htmlFor="brand-description" className="block text-sm font-light text-foreground mb-2">
              Brand Description
            </label>
            <textarea
              id="brand-description"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground resize-none"
              rows={5}
              placeholder="Describe your brand..."
              maxLength={500}
            ></textarea>
            <p className="text-xs text-muted-foreground mt-2">
              {brandDescription.length}/500 characters
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-light text-foreground mb-4 flex items-center">
              <span className="h-2 w-2 bg-primary rounded-full mr-2"></span>
              Brand Images
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="brand-logo" className="block text-sm font-light text-foreground mb-2">
                  Brand Logo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-muted/20 hover:bg-muted/30 transition-colors">
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
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                      onClick={() => {
                        if (logoInputRef.current) logoInputRef.current.click()
                      }}
                    >
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Upload size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-light text-foreground mb-1">Upload Logo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 2MB</p>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="brand-header" className="block text-sm font-light text-foreground mb-2">
                  Header Image
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-muted/20 hover:bg-muted/30 transition-colors">
                  {headerPreview ? (
                    <div 
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (headerInputRef.current) headerInputRef.current.click()
                      }}
                    >
                      <img
                        src={headerPreview}
                        alt="Header preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                      onClick={() => {
                        if (headerInputRef.current) headerInputRef.current.click()
                      }}
                    >
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Upload size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-light text-foreground mb-1">Upload Header</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 2MB</p>
                    </div>
                  )}
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleHeaderChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 font-light transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Brand Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
