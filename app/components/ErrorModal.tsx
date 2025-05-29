'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
}

export default function ErrorModal({ isOpen, onClose, title = 'Error', message }: ErrorModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        className={`bg-white rounded-lg shadow-lg max-w-md w-full transform transition-all duration-200 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <h3 className="text-lg font-medium text-red-500">{title}</h3>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          {typeof message === 'string' ? (
            <p className="text-lg font-light text-stone-700">{message}</p>
          ) : (
            message
          )}
        </div>
        
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
