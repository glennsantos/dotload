'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
}

export default function SuccessModal({ isOpen, onClose, title = 'Success', message }: SuccessModalProps) {
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
          <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-primary mr-2" />
        <h3 className="text-lg font-medium text-primary">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          {typeof message === 'string' ? (
            <p className="text-lg font-light text-foreground">{message}</p>
          ) : (
            message
          )}
        </div>
        
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 