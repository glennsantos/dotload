"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, UserIcon, KeyIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AccountSettingsPage() {
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
        console.log('Fetching user data...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Response status:', response.status);
        const userData = await response.json();
        
        if (response.ok) {
          setFullName(userData.user.name || '');
          setEmail(userData.user.email || '');
        } else {
          console.error('Error response:', userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [])
  
  // Handle form submission (both account update and password change if needed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })
    setIsLoading(true)
    
    try {
      // First update account information
      const accountResponse = await fetch('/api/user/profile', {
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
      
      if (!accountResponse.ok) {
        const errorData = await accountResponse.json()
        setMessage({ type: "error", text: errorData.message || "Failed to update account information" })
        setIsLoading(false)
        return
      }
      
      // If password fields are filled, update password too
      if (newPassword && confirmPassword) {
        // Validate passwords
        if (newPassword !== confirmPassword) {
          setMessage({ type: "error", text: "New passwords do not match" })
          setIsLoading(false)
          return
        }
        
        // Only proceed with password change if current password is provided
        if (!currentPassword) {
          setMessage({ type: "error", text: "Current password is required to change password" })
          setIsLoading(false)
          return
        }
        
        const passwordResponse = await fetch('/api/user/password', {
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
        
        if (passwordResponse.ok) {
          setMessage({ type: "success", text: "Account and password updated successfully" })
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
        } else {
          const errorData = await passwordResponse.json()
          setMessage({ type: "error", text: errorData.message || "Failed to update password" })
          setIsLoading(false)
          return
        }
      } else {
        // Only account was updated
        setMessage({ type: "success", text: "Account information updated successfully" })
      }
    } catch (error) {
      console.error('Error updating account:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
        {message.text && (
          <div className={`p-4 mb-4 rounded-md ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {message.text}
          </div>
        )}
        
        <div className="flex items-center mb-6">
          <div className="bg-emerald-100 p-2 rounded-2xl mr-3">
            <UserIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-light">Account Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full-name" className="block text-sm font-light text-stone-700 mb-1">
                Full Name
              </label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-2xl"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-light text-stone-700 mb-1">
                Email Address
              </label>
              <Input
                id="email-address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl"
                required
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-xl font-light text-stone-700 mb-4 flex items-center">
              <div className="bg-emerald-100 p-2 rounded-2xl mr-3">
              <KeyIcon className="h-5 w-5 text-emerald-600" />
              </div>
              Change Password
            </h3>
          </div>
          
          <div>
            <label htmlFor="current-password" className="block text-sm font-light text-stone-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
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
              <label htmlFor="new-password" className="block text-sm font-light text-stone-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
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
              <label htmlFor="confirm-password" className="block text-sm font-light text-stone-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 font-light"
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
