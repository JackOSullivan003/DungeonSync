'use client'

import { useEffect, useState } from 'react'

export default function ImagePreviewPanel({ currentFileId }) {
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!currentFileId) { setFile(null); return }

    async function loadFile() {
      const res = await fetch(`/api/files/${currentFileId}`)
      if (!res.ok) return
      const data = await res.json()
      setFile(data)
    }

    loadFile()
  }, [currentFileId])

  if (!currentFileId) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Select an image to preview it
    </div>
  )

  if (!file) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading…
    </div>
  )

  // Detect mime type from content (base64 data URLs carry it) or fall back to jpeg
  const mimeType = file.mimeType || 'image/jpeg'
  const src = `data:${mimeType};base64,${file.content}`

  function handleDownload() {
    const a = document.createElement('a')
    a.href = src
    a.download = file.title || 'image'
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a',
        flexShrink: 0,
      }}>
        <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: '0.9rem' }}>{file.title}</span>
        <button
          onClick={handleDownload}
          style={{ background: 'none', border: '1px solid #3a3a3a', color: '#aaa', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}
        >
          ↓ Download
        </button>
      </div>

      {/* Image preview */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <img
          src={src}
          alt={file.title}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }}
        />
      </div>

    </div>
  )
}