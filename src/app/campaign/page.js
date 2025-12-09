'use client'

import { useState, useEffect } from 'react'
import MarkdownEditor from '@/components/MarkdownEditor'

export default function CampaignPage() {
  const [notes, setNotes] = useState([])          // list of notes/files
  const [currentNoteId, setCurrentNoteId] = useState(null)

  // Load notes from API on mount
  useEffect(() => {
    async function loadNotes() {
      const res = await fetch('/api/campaign/files')
      const data = await res.json()
      setNotes(data || [])
      if (data.length) setCurrentNoteId(data[0]._id) // select first note by default
    }
    loadNotes()
  }, [])

  // Update title in local state (to update explorer instantly)
  function handleTitleChange(id, newTitle) {
    setNotes((prev) =>
      prev.map((note) => (note._id === id ? { ...note, title: newTitle } : note))
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', height: '100vh' }}>
      
      {/* File Explorer */}
      <div style={{ borderRight: '1px solid #444', background: '#111', color: 'white', overflowY: 'auto' }}>
        <h3 style={{ padding: '12px' }}>Files</h3>
        {notes.map((note) => (
          <div
            key={note._id}
            onClick={() => setCurrentNoteId(note._id)}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              background: note._id === currentNoteId ? '#222' : 'transparent'
            }}
          >
            {note.title || 'Untitled'}
          </div>
        ))}
      </div>

      {/* Markdown Editor */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {currentNoteId && (
          <MarkdownEditor
            noteId={currentNoteId}
            onTitleChange={(newTitle) => handleTitleChange(currentNoteId, newTitle)}
          />
        )}
      </div>
    </div>
  )
}
