"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Link
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Don't render on server
  if (!isMounted) {
    return (
      <div className="border border-border rounded-lg p-3 min-h-[200px] bg-background text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="border border-border rounded-lg p-3 min-h-[200px] bg-background text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  const MenuBar = () => {
    return (
      <div className="border-b border-border p-2 flex flex-wrap gap-1 bg-muted/30">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('bold') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('italic') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('strike') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-8 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-8 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('bulletList') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('orderedList') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${
            editor.isActive('blockquote') ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
          type="button"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-8 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
          type="button"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
          type="button"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-background">
      <MenuBar />
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4"
      />
    </div>
  )
}

export default RichTextEditor
