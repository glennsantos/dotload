"use client"

import { useState } from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function PaymentOptions({
  productData,
  setProductData,
  onNext,
  onBack,
  onCancel,
}: {
  productData: any
  setProductData: (data: any) => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}) {
  const [discountCodes, setDiscountCodes] = useState<Array<{code: string, amount: string, type: string, startDate: string, endDate: string}>>(productData.discountCodes || []);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, code: string, index: number}>({isOpen: false, code: '', index: -1});
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    amount: '',
    type: 'percentage',
    startDate: '',
    endDate: ''
  });
  const handleToggleOption = (option: string) => {
    setProductData({
      ...productData,
      paymentOptions: {
        ...productData.paymentOptions,
        [option]: !productData.paymentOptions[option],
      },
    })
    
    // Initialize discount codes array when enabling the option
    if (option === "offerCoupons" && !productData.paymentOptions?.offerCoupons) {
      setDiscountCodes([]);
    }
  }

  return (
    <div>

      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name || "New Product"}
        </h1>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={onCancel} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <X size={18} /> Cancel
          </button>
          <button 
            onClick={() => {
              // Ensure discount codes are saved in the product data
              if (productData.paymentOptions?.offerCoupons) {
                setProductData({
                  ...productData,
                  discountCodes: discountCodes
                });
              } else {
                // If coupons are disabled, clear any existing discount codes
                setProductData({
                  ...productData,
                  discountCodes: []
                });
              }
              onNext();
            }} 
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            Save and continue
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4">Payment Options</h2>
          <p className="text-gray-600 mb-6">Configure how customers can pay for your product.</p>

          <div className="space-y-4">

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Offer coupons</h3>
                  <p className="text-sm text-gray-600">Create discount coupons for your product</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={productData.paymentOptions?.offerCoupons || false}
                    onChange={() => handleToggleOption("offerCoupons")}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {productData.paymentOptions?.offerCoupons && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-3">Discount Codes</h3>
                  
                  {/* Delete Confirmation Modal */}
                  {deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-600">
                          Are you sure you want to delete the discount code 
                          <span className="font-semibold text-red-600"> {deleteConfirmation.code}</span>?
                        </p>
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => setDeleteConfirmation({ isOpen: false, code: '', index: -1 })}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              // Remove from local state
                              const updatedCodes = [...discountCodes];
                              updatedCodes.splice(deleteConfirmation.index, 1);
                              setDiscountCodes(updatedCodes);
                              
                              // Update the product data
                              setProductData({
                                ...productData,
                                discountCodes: updatedCodes
                              });
                              
                              setDeleteConfirmation({ isOpen: false, code: '', index: -1 });
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {discountCodes.length > 0 && (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-3 rounded-t grid grid-cols-5 gap-2 font-medium text-sm">
                        <div>Code</div>
                        <div>Amount</div>
                        <div>Type</div>
                        <div>Start Date</div>
                        <div>End Date</div>
                      </div>
                      <div className="border border-t-0 rounded-b divide-y">
                        {discountCodes.map((code, index) => (
                          <div key={index} className="p-3 grid grid-cols-5 gap-2 items-center text-sm">
                            <div>{code.code}</div>
                            <div>{code.amount}</div>
                            <div>{code.type}</div>
                            <div>{code.startDate}</div>
                            <div className="flex items-center justify-between">
                              <span>{code.endDate}</span>
                              <button 
                                onClick={() => {
                                  setDeleteConfirmation({
                                    isOpen: true,
                                    code: code.code,
                                    index: index
                                  });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border rounded p-3 mb-3">
                    <h4 className="font-medium mb-2">Add New Discount Code</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Discount Code</label>
                        <input 
                          type="text" 
                          value={newDiscountCode.code}
                          onChange={(e) => setNewDiscountCode({...newDiscountCode, code: e.target.value})}
                          placeholder="e.g. SUMMER20" 
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Discount Amount</label>
                        <input 
                          type="number" 
                          value={newDiscountCode.amount}
                          onChange={(e) => setNewDiscountCode({...newDiscountCode, amount: e.target.value})}
                          placeholder="e.g. 20" 
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Discount Type</label>
                        <select 
                          value={newDiscountCode.type}
                          onChange={(e) => setNewDiscountCode({...newDiscountCode, type: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input 
                          type="date" 
                          value={newDiscountCode.startDate}
                          onChange={(e) => setNewDiscountCode({...newDiscountCode, startDate: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input 
                          type="date" 
                          value={newDiscountCode.endDate}
                          onChange={(e) => setNewDiscountCode({...newDiscountCode, endDate: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!newDiscountCode.code || !newDiscountCode.amount) {
                          alert('Please enter a discount code and amount');
                          return;
                        }
                        
                        // Check for duplicate codes
                        if (discountCodes.some(code => code.code.toLowerCase() === newDiscountCode.code.toLowerCase())) {
                          alert('A discount code with this name already exists');
                          return;
                        }
                        
                        // Add the new discount code
                        const updatedCodes = [...discountCodes, newDiscountCode];
                        setDiscountCodes(updatedCodes);
                        
                        // Update the product data to include the new discount codes
                        setProductData({
                          ...productData,
                          discountCodes: updatedCodes
                        });
                        
                        setNewDiscountCode({
                          code: '',
                          amount: '',
                          type: 'percentage',
                          startDate: '',
                          endDate: ''
                        });
                      }}
                      className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
                    >
                      Add Discount Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
