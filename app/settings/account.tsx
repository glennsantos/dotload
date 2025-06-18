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
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: "success", text: "Account information updated successfully" })
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update account information" })
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
    
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long" })
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
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update password" })
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
      <div className="claude-card p-6 mb-8">
        <form onSubmit={handleUpdateAccount} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full-name" className="block text-sm font-light text-foreground mb-2">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-light text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email-address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 font-light transition-colors"
              disabled={isLoading}
            >
              Update Account
            </button>
          </div>
        </form>
      </div>
      
      <div className="claude-card p-6">
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg border ${message.type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label htmlFor="current-password" className="block text-sm font-light text-foreground mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-light text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-light text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
              className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 font-light transition-colors"
              disabled={isLoading}
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
