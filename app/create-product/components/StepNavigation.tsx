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
    <div className="flex justify-end gap-3 mt-6">
      <button 
        onClick={onBack} 
        className="px-4 py-2 border border-border rounded-2xl hover:bg-muted text-foreground font-light flex items-center transition-colors"
        disabled={isSubmitting}
      >
        <ChevronLeft size={18} className="mr-1" />
        Back
      </button>
      <button 
        onClick={onNext} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 font-light flex items-center transition-colors"
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
