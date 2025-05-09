"use client"

import { useEffect, useState } from 'react'

interface RichTextRendererProps {
  content: string
  className?: string
}

const RichTextRenderer = ({ content, className = '' }: RichTextRendererProps) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render on server
  if (!isMounted) {
    return <div className={`${className} min-h-[20px]`}>Loading content...</div>
  }

  // If content is empty or not HTML, just return it as plain text
  if (!content || (!content.includes('<') && !content.includes('>'))) {
    return <div className={className}>{content || 'No content available'}</div>
  }

  return (
    <div 
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export default RichTextRenderer
