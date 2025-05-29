"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function AccountSettings() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const userData = await response.json()
          setFullName(userData.name || '')
          setEmail(userData.email || '')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [])
  
  // Handle account update
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fullName,
          email
        }),
        credentials: 'include'
      })
      
      if (response.ok) {
        setMessage({ type: "success", text: "Account information updated successfully" })
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.message || "Failed to update account information" })
      }
    } catch (error) {
      console.error('Error updating account:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }
    
    setMessage({ type: "", text: "" })
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
        credentials: 'include'
      })
      
      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.message || "Failed to update password" })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center">
          <div className="bg-emerald-100 p-2 rounded-full mr-3">
            <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2 className="text-xl font-medium">Account Settings</h2>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
        <form onSubmit={handleUpdateAccount} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-stone-700 mb-1">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-stone-700 mb-1">
                Email Address
              </label>
              <input
                id="email-address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              Update Account
            </button>
          </div>
        </form>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center">
          <div className="bg-emerald-100 p-2 rounded-full mr-3">
            <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="text-xl font-medium">Change Password</h2>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        {message.text && (
          <div className={`p-4 mb-4 rounded-md ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-stone-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-stone-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              Update Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
