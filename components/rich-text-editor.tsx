"use client"

import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Hook to detect mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !editorRef.current) return

    // Initialize Quill
    if (!quillRef.current) {
      // Different toolbar configurations for mobile vs desktop
      const toolbarConfig = isMobile ? [
        // Mobile: More compact toolbar
        ['bold', 'italic'], // Core formatting only
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
        ['link'], // Links
        ['clean'] // Remove formatting
      ] : [
        // Desktop: Full toolbar
        [{ 'header': [2, 3, false] }], // Headers
        ['bold', 'italic'], // Core text formatting
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
        ['link'], // Links
        ['clean'] // Remove formatting
      ]
      
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: toolbarConfig,
          clipboard: {
            // Enhanced clipboard handling for copy-paste from Word, browsers, etc.
            matchVisual: false, // Preserves formatting but cleans unnecessary styles
          }
        },
        formats: [
          'header', 'bold', 'italic', 'list', 'bullet', 'link'
        ]
      })

      // Set initial content
      if (value) {
        quillRef.current.root.innerHTML = value
      }

      // Listen for text changes
      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML
          // Only call onChange if content actually changed
          if (html !== value) {
            onChange(html === '<p><br></p>' ? '' : html)
          }
        }
      })
    }

    // Clean up on unmount
    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [isMounted, placeholder, isMobile])

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      const selection = quillRef.current.getSelection()
      quillRef.current.root.innerHTML = value || ''
      if (selection) {
        quillRef.current.setSelection(selection)
      }
    }
  }, [value])

  // Don't render on server
  if (!isMounted) {
    return (
      <div className="border border-border rounded-lg p-3 min-h-[200px] bg-background text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="quill-editor-wrapper">
      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar {
          border: 1px solid hsl(var(--border));
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          background: hsl(var(--muted) / 0.3);
          padding: 4px 8px; /* Reduced padding */
          min-height: auto; /* Remove fixed height */
        }
        
        .quill-editor-wrapper .ql-toolbar .ql-formats {
          margin-right: 8px; /* Reduced spacing between groups */
        }
        
        .quill-editor-wrapper .ql-toolbar .ql-formats:last-child {
          margin-right: 0;
        }
        
        .quill-editor-wrapper .ql-container {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 8px 8px;
          background: hsl(var(--background));
          min-height: 200px; /* Increased for desktop */
          font-family: inherit;
        }
        
        .quill-editor-wrapper .ql-editor {
          min-height: 200px; /* Increased for desktop */
          padding: 16px; /* Better padding for desktop */
          color: hsl(var(--foreground));
          font-size: 14px;
          line-height: 1.6;
        }
        
        /* Hide any default textarea that might appear */
        .quill-editor-wrapper textarea {
          display: none !important;
        }
        
        /* Ensure the editor div takes full width */
        .quill-editor-wrapper .ql-container .ql-editor {
          width: 100%;
          outline: none;
        }
        
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
          left: 16px; /* Adjusted for desktop padding */
        }
        
        /* Smaller toolbar buttons */
        .quill-editor-wrapper .ql-toolbar button {
          width: 28px !important;
          height: 28px !important;
          padding: 4px !important;
        }
        
        .quill-editor-wrapper .ql-toolbar .ql-picker {
          height: 28px !important;
        }
        
        .quill-editor-wrapper .ql-toolbar .ql-picker-label {
          padding: 4px 8px !important;
          font-size: 13px !important;
          line-height: 20px !important;
        }
        
        /* Mobile-specific styles - single row toolbar */
        @media (max-width: 640px) {
          .quill-editor-wrapper .ql-toolbar {
            padding: 4px 6px !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            gap: 2px !important;
            min-height: 40px !important;
            height: 40px !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          .quill-editor-wrapper .ql-toolbar::-webkit-scrollbar {
            display: none !important;
          }
          
          .quill-editor-wrapper .ql-toolbar .ql-formats {
            margin-right: 4px !important;
            margin-bottom: 0 !important;
            display: flex !important;
            gap: 1px !important;
            flex-shrink: 0 !important;
          }
          
          .quill-editor-wrapper .ql-toolbar .ql-formats:last-child {
            margin-right: 0 !important;
          }
          
          .quill-editor-wrapper .ql-toolbar button {
            width: 28px !important;
            height: 28px !important;
            padding: 4px !important;
            margin: 0 !important;
            border-radius: 3px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          
          .quill-editor-wrapper .ql-toolbar .ql-picker {
            height: 28px !important;
            min-width: 50px !important;
            flex-shrink: 0 !important;
          }
          
          .quill-editor-wrapper .ql-toolbar .ql-picker-label {
            padding: 4px 6px !important;
            font-size: 11px !important;
            line-height: 16px !important;
            height: 28px !important;
            display: flex !important;
            align-items: center !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          
          .quill-editor-wrapper .ql-toolbar button svg,
          .quill-editor-wrapper .ql-toolbar .ql-stroke,
          .quill-editor-wrapper .ql-toolbar .ql-fill {
            width: 14px !important;
            height: 14px !important;
          }
          
          .quill-editor-wrapper .ql-container {
            min-height: 150px !important;
            border-radius: 0 0 8px 8px !important;
          }
          
          .quill-editor-wrapper .ql-editor {
            min-height: 150px !important;
            padding: 12px !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          
          .quill-editor-wrapper .ql-editor.ql-blank::before {
            left: 12px !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          
          /* Better mobile hover and active states */
          .quill-editor-wrapper .ql-toolbar button:hover,
          .quill-editor-wrapper .ql-toolbar button.ql-active {
            background: hsl(var(--muted)) !important;
          }
          
          /* Ensure picker dropdowns work well on mobile */
          .quill-editor-wrapper .ql-picker.ql-expanded .ql-picker-label {
            border-color: hsl(var(--primary)) !important;
          }
          
          .quill-editor-wrapper .ql-picker-options {
            max-height: 200px !important;
            overflow-y: auto !important;
          }
        }
        
        .quill-editor-wrapper .ql-snow .ql-tooltip {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .quill-editor-wrapper .ql-snow .ql-tooltip input[type=text] {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          padding: 6px;
          border-radius: 4px;
          font-size: 13px;
        }
        
        .quill-editor-wrapper .ql-snow .ql-tooltip a.ql-action::after,
        .quill-editor-wrapper .ql-snow .ql-tooltip a.ql-remove::after {
          color: hsl(var(--primary));
        }
        
        .quill-editor-wrapper .ql-snow .ql-picker-options {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .quill-editor-wrapper .ql-snow .ql-picker-item {
          padding: 6px 12px;
          font-size: 13px;
        }
        
        .quill-editor-wrapper .ql-snow .ql-picker-item:hover {
          background: hsl(var(--muted));
        }
        
        .quill-editor-wrapper .ql-snow .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }
        
        .quill-editor-wrapper .ql-snow .ql-fill {
          fill: hsl(var(--muted-foreground));
        }
        
        .quill-editor-wrapper .ql-snow.ql-toolbar button:hover,
        .quill-editor-wrapper .ql-snow .ql-toolbar button:hover,
        .quill-editor-wrapper .ql-snow.ql-toolbar button.ql-active,
        .quill-editor-wrapper .ql-snow .ql-toolbar button.ql-active {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        
        .quill-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
        .quill-editor-wrapper .ql-snow .ql-toolbar button:hover .ql-stroke,
        .quill-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .quill-editor-wrapper .ql-snow .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }
        
        .quill-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-fill,
        .quill-editor-wrapper .ql-snow .ql-toolbar button:hover .ql-fill,
        .quill-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .quill-editor-wrapper .ql-snow .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  )
}

export default RichTextEditor
