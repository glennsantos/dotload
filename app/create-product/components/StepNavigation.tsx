'use client'

import { ChevronLeft, Loader } from 'lucide-react'

interface StepNavigationProps {
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
        className="px-4 py-2 border rounded-md hover:bg-muted flex items-center"
        disabled={isSubmitting}
      >
        <ChevronLeft size={18} className="mr-1" />
        Back
      </button>
      <button 
        onClick={onNext} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
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
