"use client"

import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !editorRef.current) return

    // Initialize Quill
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: [
            // Compact toolbar with only essential formatting
            [{ 'header': [2, 3, false] }], // Only H2, H3, and normal
            ['bold', 'italic'], // Core text formatting
            [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
            ['link'], // Links
            ['clean'] // Remove formatting
          ],
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
  }, [isMounted, placeholder])

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
          min-height: 150px; /* Reduced height */
          font-family: inherit;
        }
        
        .quill-editor-wrapper .ql-editor {
          min-height: 150px; /* Reduced height */
          padding: 12px; /* Reduced padding */
          color: hsl(var(--foreground));
          font-size: 14px;
          line-height: 1.6;
        }
        
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
          left: 12px; /* Adjusted for reduced padding */
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
