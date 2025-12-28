'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileSidebar from '@/components/FileSidebar'
import TopBar from '@/components/TopBar'

export default function CampaignPage() {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [currentNoteId, setCurrentNoteId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const flushRef = useRef(null)


  // Load notes (shared by poll + sidebar)
  const loadNotes = useCallback(async () => {
    const res = await fetch('/api/campaign/files')
    const data = await res.json()

    setNotes((prev) => {
      if (isDirty && currentNoteId) {
        // Don't overwrite active dirty note
        return prev.map((n) =>
          n._id === currentNoteId
            ? n
            : data.find((d) => d._id === n._id) || n
        )
      }
      return data
    })

    // Ensure selected note still exists
    if (currentNoteId && !data.find(n => n._id === currentNoteId)) {
      setCurrentNoteId(data[0]?._id || null)
    }
  }, [currentNoteId, isDirty])

  // Poll file list every 5s
  useEffect(() => {
    loadNotes()
    const id = setInterval(loadNotes, 5000)
    return () => clearInterval(id)
  }, [loadNotes])

  // Initial load
  useEffect(() => {
    loadNotes()
  }, [])


  async function createFolder(parentId = null) {
    console.log("createFolder hit");
    const res = await fetch('/api/campaign/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Folder', parentId }),
    });
    const newFolder = await res.json();
    loadNotes(); // refresh tree or file list
    return newFolder;
  }


  async function createFile(folderId = null) {
    const res = await fetch('/api/campaign/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', folderId }),
    })

    const file = await res.json()
    loadTree()
    setCurrentNoteId(file._id)
  }

  async function loadTree() {
    const res = await fetch('/api/campaign/tree')
    const data = await res.json()

    setFolders(data.folders)
    setNotes(data.files)
  }

  // Safe file switch (flush pending edits)
  async function switchFile(id) {
    if (isDirty && flushRef.current) {
      await flushRef.current()
    }
    setCurrentNoteId(id)
  }

  // Update sidebar title instantly
  function handleTitleChange(id, title) {
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, title } : n))
    )
  }

  return (
  <div className='app-wrapper'>
    <TopBar title="Test-Campaign" />

    <div className="layout-container">
      {/* Sidebar */}
      <FileSidebar
        folders={folders}
        notes={notes}
        currentNoteId={currentNoteId}
        onSelect={switchFile}
        onCreateFile={createFile}
        onCreateFolder={createFolder}
      />


      {/* Editor */}
      {currentNoteId && (
        <MarkdownEditor
          noteId={currentNoteId}
          onTitleChange={handleTitleChange}
          onDirtyChange={setIsDirty}
          registerFlush={(fn) => (flushRef.current = fn)}
        />
      )}
    </div>
  </div>
  )
}
