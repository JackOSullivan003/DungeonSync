'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'

export default function MarkdownEditor({ noteId, onTitleChange }) {
  const [note, setNote] = useState(null)
  const saveTimeout = useRef(null)

  // --- Save note to DB ---
  async function saveNote(changes) {
    if (!note) return

    const updated = {
      ...note,
      ...changes,
      updatedAt: Date.now(),
    }

    setNote(updated)

    await fetch(`/api/campaign/files/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
  }

  // --- Debounce helper ---
  const debounceSave = useCallback((data) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveNote(data)
    }, 1400)
  }, [note])

  // --- Initialize Tiptap ---
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style: `
          background-color: #1e1e1e;
          color: white;
          caret-color: white;
        `
      }
    },
    onUpdate: ({ editor }) => {
      if (!note) return
      if (!editor.storage.markdown) return
      const markdown = editor.getMarkdown()
      debounceSave({ content: markdown })
    }
  })

  // --- Flush pending save when switching files ---
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
        saveNote(note)
      }
    }
  }, [noteId])

  // --- Load Note ---
  useEffect(() => {
    if (!noteId || !editor) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
      saveNote(note) // flush previous note
    }

    async function loadNote() {
      const res = await fetch(`/api/campaign/files/${noteId}`)
      const data = await res.json()
      setNote(data || { title: '', content: '' })

      // Set editor content
      editor.commands.setContent(data?.content || '')
    }

    loadNote()
  }, [noteId, editor])

  if (!note) return <div style={{ padding: 20 }}>Loading…</div>

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: 'white',
    }}>
      <input
        value={note.title || ''}
        onChange={(e) => {
          const newTitle = e.target.value
          saveNote({ title: newTitle })        // save to DB
          if (onTitleChange) onTitleChange(newTitle) // update explorer
        }}
        style={{
          width: '100%',
          padding: '12px',
          background: '#1e1e1e',
          color: 'white',
          border: 'none',
          borderBottom: '1px solid #333',
          fontSize: '20px',
          fontWeight: 'bold',
          outline: 'none',
        }}
      />

      {/* Editor */}
      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          borderBottom: '1px solid white',
          backgroundColor: '#1e1e1e'
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            padding: '16px',
            minHeight: '90%',
            boxSizing: 'border-box',
            
          }}
        />
      </div>
    </div>
  )
}
