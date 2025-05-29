"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCardIcon } from "lucide-react"


export default function BillingPage() {
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  
  return (
    <div>
      
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-emerald-100 p-2 rounded-2xl mr-3">
            <CreditCardIcon size={16} className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-light">Current Plan</h3>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-base font-light">Free Plan</h4>
              <p className="text-sm text-stone-500">Perfect for getting started</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-light bg-emerald-100 text-emerald-800">
              Current
            </span>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          Upgrade to Pro
        </button>
      </div>
      
      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
        <h3 className="text-lg font-light mb-4">Payment Method</h3>
        
        {isAddingPayment ? (
          <div>
            <form className="space-y-4">
              <div>
                <label htmlFor="card-name" className="block text-sm font-light text-stone-700 mb-1">
                  Name on Card
                </label>
                <input
                  id="card-name"
                  type="text"
                  className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="card-number" className="block text-sm font-light text-stone-700 mb-1">
                  Card Number
                </label>
                <input
                  id="card-number"
                  type="text"
                  className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry-date" className="block text-sm font-light text-stone-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    id="expiry-date"
                    type="text"
                    className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="MM/YY"
                  />
                </div>
                
                <div>
                  <label htmlFor="cvc" className="block text-sm font-light text-stone-700 mb-1">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    type="text"
                    className="w-full p-2 border border-stone-300 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="123"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-light"
                >
                  Save Card
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-2xl hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 font-light"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-stone-600 mb-4">No payment method on file</p>
            
            <button
              onClick={() => setIsAddingPayment(true)}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-2xl hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 font-light"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>
      
      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-light mb-4">Billing History</h3>
        
        <p className="text-stone-600">No billing history available</p>
      </div>
    </div>
  )
}
