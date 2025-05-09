"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none min-h-[150px] max-w-none',
      },
    },
  })

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update content when value prop changes
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

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
      <div className="bg-white p-3">
        <div className="flex gap-2 mb-2 border-b pb-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" x2="21" y1="6" y2="6"/><line x1="9" x2="21" y1="12" y2="12"/><line x1="9" x2="21" y1="18" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Ordered List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
            title="Heading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>
          </button>
        </div>
        <EditorContent editor={editor} className="min-h-[150px]" />
      </div>
    </div>
  )
}

export default RichTextEditor
