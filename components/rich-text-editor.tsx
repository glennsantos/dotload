"use client"

import { Editor } from '@hugerte/hugerte-react'
import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [editorContent, setEditorContent] = useState(value)

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update local content when value prop changes
  useEffect(() => {
    if (value !== editorContent) {
      setEditorContent(value)
    }
  }, [value])

  // Don't render on server
  if (!isMounted) {
    return (
      <div className="border rounded-md p-3 min-h-[150px] bg-white">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        value={editorContent}
        onEditorChange={(newContent) => {
          setEditorContent(newContent)
          onChange(newContent)
        }}
        init={{
          height: 300,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          branding: false
        }}
      />
    </div>
  )
}

export default RichTextEditor
