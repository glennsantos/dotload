"use client"

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
  const handleToggleOption = (option: string) => {
    setProductData({
      ...productData,
      paymentOptions: {
        ...productData.paymentOptions,
        [option]: !productData.paymentOptions[option],
      },
    })
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
          <button onClick={onNext} className="px-4 py-2 bg-black text-white rounded-md">
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
                  <h3 className="font-medium">Pay what you want</h3>
                  <p className="text-sm text-gray-600">Allow customers to pay more than your set price</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={productData.paymentOptions?.allowPayWhatYouWant || false}
                    onChange={() => handleToggleOption("allowPayWhatYouWant")}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {productData.paymentOptions?.allowPayWhatYouWant && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm">Suggested Price</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                          $
                        </span>
                        <input
                          type="text"
                          className="flex-1 p-2 border rounded-r-md"
                          placeholder="0.00"
                          defaultValue={productData.price || "2.99"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Minimum Price</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                          $
                        </span>
                        <input
                          type="text"
                          className="flex-1 p-2 border rounded-r-md"
                          placeholder="0.00"
                          defaultValue="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Offer coupons</h3>
                  <p className="text-sm text-gray-600">Create discount codes for your product</p>
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
                  <button className="px-4 py-2 bg-black text-white rounded-md">Create Coupon</button>
                </div>
              )}
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Subscription billing</h3>
                  <p className="text-sm text-gray-600">Charge customers on a recurring basis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={productData.paymentOptions?.subscriptionBilling || false}
                    onChange={() => handleToggleOption("subscriptionBilling")}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {productData.paymentOptions?.subscriptionBilling && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm">Billing Interval</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Free Trial (days)</label>
                      <input type="number" className="w-full p-2 border rounded-md" placeholder="0" min="0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4">Payment Methods</h2>

          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Credit Card</h3>
                <span className="text-green-600 text-sm">Connected</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Accept payments via credit card (enabled by default)</p>
              <div className="flex gap-2">
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-medium">Visa</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-medium">Mastercard</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-medium">Amex</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-medium">Discover</span>
                </div>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">PayPal</h3>
                <button className="text-blue-600">Connect</button>
              </div>
              <p className="text-sm text-gray-600">Connect your PayPal account to accept payments</p>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Apple Pay</h3>
                <button className="text-blue-600">Connect</button>
              </div>
              <p className="text-sm text-gray-600">Allow customers to pay with Apple Pay</p>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Google Pay</h3>
                <button className="text-blue-600">Connect</button>
              </div>
              <p className="text-sm text-gray-600">Allow customers to pay with Google Pay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
