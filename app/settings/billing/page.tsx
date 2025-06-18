"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BillingPage() {
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  
  return (
    <div>
      {/* Current Plan */}
      <div className="claude-card p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="bg-primary/10 p-2 rounded-2xl mr-3">
            <CreditCardIcon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-light text-foreground">Current Plan</h3>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-base font-light text-foreground">Free Plan</h4>
              <p className="text-sm text-muted-foreground">Perfect for getting started</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-light bg-primary/10 text-primary">
              Current
            </span>
          </div>
        </div>
        
        <Button variant="default" className="rounded-2xl font-light">
          Upgrade to Pro
        </Button>
      </div>
      
      {/* Payment Method */}
      <div className="claude-card p-6 mb-8">
        <h3 className="text-lg font-light mb-6 text-foreground">Payment Method</h3>
        
        {isAddingPayment ? (
          <div>
            <form className="space-y-6">
              <div>
                <label htmlFor="card-name" className="block text-sm font-light text-foreground mb-2">
                  Name on Card
                </label>
                <input
                  id="card-name"
                  type="text"
                  className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="card-number" className="block text-sm font-light text-foreground mb-2">
                  Card Number
                </label>
                <input
                  id="card-number"
                  type="text"
                  className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry-date" className="block text-sm font-light text-foreground mb-2">
                    Expiry Date
                  </label>
                  <input
                    id="expiry-date"
                    type="text"
                    className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="MM/YY"
                  />
                </div>
                
                <div>
                  <label htmlFor="cvc" className="block text-sm font-light text-foreground mb-2">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    type="text"
                    className="w-full p-3 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="123"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-light transition-colors"
                >
                  Save Card
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(false)}
                  className="px-6 py-3 border border-border text-foreground rounded-2xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-light transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-6">No payment method on file</p>
            
            <button
              onClick={() => setIsAddingPayment(true)}
              className="px-6 py-3 border border-border text-foreground rounded-2xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-light transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>
      
      {/* Billing History */}
      <div className="claude-card p-6">
        <h3 className="text-lg font-light mb-6 text-foreground">Billing History</h3>
        
        <p className="text-muted-foreground">No billing history available</p>
      </div>
    </div>
  )
}
