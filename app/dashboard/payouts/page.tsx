"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, DollarSign, RefreshCw, Download } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function PayoutsPage() {
  const [balance, setBalance] = useState({
    total: 0,
    available: 0,
    pending: 0,
  })
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userLogo, setUserLogo] = useState("");
  
  // Form state
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState("BDO")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Bank options for the Philippines
  const bankOptions = [
    { code: "BDO", name: "Banco de Oro (BDO)" },
    { code: "BPI", name: "Bank of the Philippine Islands (BPI)" },
    { code: "LANDBANK", name: "Land Bank of the Philippines" },
    { code: "METROBANK", name: "Metropolitan Bank and Trust Company" },
    { code: "PNB", name: "Philippine National Bank (PNB)" },
    { code: "UNIONBANK", name: "Union Bank of the Philippines" },
    { code: "EASTWEST", name: "EastWest Bank" },
    { code: "SECURITYBANK", name: "Security Bank" },
    { code: "RCBC", name: "Rizal Commercial Banking Corporation" },
    { code: "CHINABANK", name: "China Banking Corporation" },
  ]

  useEffect(() => {
    fetchPayoutData()
    // Fetch user data for DashboardHeader
    const fetchUserData = async () => {
      try {
        const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
        if (authResponse.ok) {
          const userData = await authResponse.json();
          const user = userData.user || userData;
          setUserName(user.name || 'User');
          setUserEmail(user.email || '');
          setUserLogo(user.storeLogoPath || '');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, [])

  const fetchPayoutData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payouts', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setBalance(data.balance)
      setPayouts(data.payouts)
    } catch (err) {
      console.error('Error fetching payout data:', err)
      setError('Failed to load payout information. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset states
    setFormError(null)
    setFormSuccess(null)
    
    // Validate form
    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Please enter a valid amount")
      return
    }
    
    if (!accountNumber) {
      setFormError("Please enter your account number")
      return
    }
    
    if (!accountHolderName) {
      setFormError("Please enter the account holder name")
      return
    }
    
    // Check if amount is greater than available balance
    if (parseFloat(amount) > balance.available) {
      setFormError(`Insufficient balance. Your available balance is ${balance.available}`)
      return
    }
    
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankCode,
          accountNumber,
          accountHolderName,
        }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process payout request")
      }
      
      // Success
      setFormSuccess("Payout request submitted successfully")
      setShowRequestForm(false)
      
      // Reset form
      setAmount("")
      setAccountNumber("")
      setAccountHolderName("")
      
      // Refresh payout data
      fetchPayoutData()
    } catch (err: any) {
      console.error('Error requesting payout:', err)
      setFormError(err.message || "Failed to process payout request")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-primary/10 text-primary'
      case 'pending':
        return 'bg-secondary/20 text-secondary-foreground'
      case 'failed':
        return 'bg-destructive/10 text-destructive'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading payout information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-destructive">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchPayoutData}
            className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2"
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-sm text-gray-500 mb-1">Total Earnings</h2>
          <p className="text-2xl font-medium">₱{balance.total.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-sm text-gray-500 mb-1">Available Balance</h2>
          <p className="text-2xl font-medium">₱{balance.available.toFixed(2)}</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-sm text-gray-500 mb-1">Pending Payouts</h2>
          <p className="text-2xl font-medium">₱{balance.pending.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Payout request form */}
      {showRequestForm && (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Request Payout</h2>
          
          {formError && (
            <div className="mb-4 p-4 bg-destructive/10 rounded-md text-destructive">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleRequestPayout}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium">Amount (₱)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: ₱{balance.available.toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Bank</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  required
                >
                  {bankOptions.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  placeholder="Enter your account number"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  placeholder="Enter account holder name"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 border rounded-md"
                disabled={submitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Payout history */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Payout History</h2>
        </div>
        
        {payouts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No payout history found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payout.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{payout.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payout.bankCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payout.accountNumber.slice(0, 4)}****{payout.accountNumber.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payout.status)}`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
