"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Password reset instructions have been sent to your email.")
        setEmail("")
      } else {
        setError(data.message || "Failed to process your request. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-8">
        <Link href="/" className="block">
          <Image 
            src="/logo.png" 
            alt="Alacart Logo" 
            width={100} 
            height={21} 
            className="h-auto"
            priority
          />
        </Link>
      </div>
      <div className="text-center w-full max-w-md px-4">
        <h1 className="text-4xl font-extralight mb-4">Forgot Password</h1>
                  <p className="text-muted-foreground font-light mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>
      <Card className="w-full max-w-md py-6">
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
                      <Alert className="mb-4 bg-primary/10 text-primary border-primary/20 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground font-light">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-border rounded-2xl h-12 font-light focus:border-primary focus:ring-primary"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-12 font-light" 
              disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center font-light">Sending... <Mail className="ml-2 h-4 w-4 animate-pulse" /></span>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>
            
                      <div className="text-center mt-4 text-sm text-muted-foreground font-light">
            <Link href="/login" className="text-primary hover:text-primary/80 font-light flex items-center justify-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
