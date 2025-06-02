'use client'

import { ChevronLeft, Loader } from 'lucide-react'

type StepNavigationProps = {
  onBack: () => void
  onNext: () => void
  currentStep: number
  totalSteps: number
  isSubmitting?: boolean
}

export default function StepNavigation({
  onBack,
  onNext,
  currentStep,
  totalSteps,
  isSubmitting = false
}: StepNavigationProps) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      <button 
        onClick={onBack} 
        className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center"
        disabled={isSubmitting}
      >
        <ChevronLeft size={18} className="mr-1" />
        Back
      </button>
      <button 
        onClick={onNext} 
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader size={18} className="mr-2 animate-spin" />
            {currentStep === totalSteps ? 'Publishing...' : 'Processing...'}
          </>
        ) : (
          currentStep === totalSteps ? 'Publish Product' : 'Next'
        )}
      </button>
    </div>
  )
}
