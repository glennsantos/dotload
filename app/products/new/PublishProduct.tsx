"use client"

import { useState } from "react"
import { X, Calendar, Globe, Lock, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function PublishProduct({
  productData,
  onPublish,
  onBack,
  onCancel,
  isSubmitting = false,
}: {
  productData: any
  onPublish: () => void
  onBack: () => void
  onCancel: () => void
  isSubmitting?: boolean
}) {
  const [publishOption, setPublishOption] = useState("now")
  const [visibility, setVisibility] = useState("public")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  return (
    <div>
      <header className="p-6 border-b flex justify-between items-center">
        <h1 className="text-3xl font-normal truncate">
          {productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
        </h1>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 border rounded-md flex items-center gap-2">
            Back
          </button>
          <button onClick={onCancel} className="px-4 py-2 border rounded-md flex items-center gap-2">
            <X size={18} /> Cancel
          </button>
          <button 
            onClick={onPublish} 
            disabled={isSubmitting}
            className={`px-4 py-2 bg-black text-white rounded-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4">Publish Settings</h2>
          <p className="text-gray-600 mb-6">Configure when and how your product will be available.</p>

          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h3 className="font-medium mb-4">When to publish</h3>

              <div className="space-y-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish-option"
                    value="now"
                    checked={publishOption === "now"}
                    onChange={() => setPublishOption("now")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Publish now</div>
                    <div className="text-sm text-gray-600">Make your product available immediately</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish-option"
                    value="schedule"
                    checked={publishOption === "schedule"}
                    onChange={() => setPublishOption("schedule")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Schedule for later</div>
                    <div className="text-sm text-gray-600 mb-2">Choose a specific date and time to publish</div>

                    {publishOption === "schedule" && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Calendar size={16} className="text-gray-500" />
                          </div>
                          <input
                            type="date"
                            className="w-full p-2 pl-10 border rounded-md"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Clock size={16} className="text-gray-500" />
                          </div>
                          <input
                            type="time"
                            className="w-full p-2 pl-10 border rounded-md"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish-option"
                    value="draft"
                    checked={publishOption === "draft"}
                    onChange={() => setPublishOption("draft")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Save as draft</div>
                    <div className="text-sm text-gray-600">Save your product but don't publish it yet</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="border rounded-md p-6">
              <h3 className="font-medium mb-4">Visibility</h3>

              <div className="space-y-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span className="font-medium">Public</span>
                    </div>
                    <div className="text-sm text-gray-600">Anyone can find and purchase your product</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="unlisted"
                    checked={visibility === "unlisted"}
                    onChange={() => setVisibility("unlisted")}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock size={16} />
                      <span className="font-medium">Unlisted</span>
                    </div>
                    <div className="text-sm text-gray-600">Only people with the link can access your product</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="password"
                    checked={visibility === "password"}
                    onChange={() => setVisibility("password")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Lock size={16} />
                      <span className="font-medium">Password protected</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Require a password to access your product</div>

                    {visibility === "password" && (
                      <div className="mt-3">
                        <input type="password" className="w-full p-2 border rounded-md" placeholder="Enter password" />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="border rounded-md p-6">
              <h3 className="font-medium mb-4">Search Engine Optimization</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Meta Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter meta title"
                    defaultValue={productData.name}
                  />
                  <p className="text-xs text-gray-500 mt-1">Appears in browser tab and search results</p>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Meta Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-20"
                    placeholder="Enter meta description"
                    defaultValue={productData.description?.substring(0, 160) || ""}
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">Brief description that appears in search results</p>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Keywords</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., travel, japan, guide"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated keywords related to your product</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={onPublish} 
            disabled={isSubmitting}
            className={`px-6 py-3 bg-black text-white rounded-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
