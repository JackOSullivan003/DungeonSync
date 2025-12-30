'use client'

import { useEffect, useState, useRef, use } from 'react'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileSidebar from '@/components/FileSidebar'
import TopBar from '@/components/TopBar'

export default function CampaignPage({ params }) {
  const campaignId = use(params).Campaignid
  //console.log("campaignPage campaignId: ", campaignId)

    const [files, setFiles] = useState([])
  const [currentFileId, setCurrentFileId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const flushRef = useRef(null)

  /* ---------- Safe file switch ---------- */
  async function switchFile(id) {
    if (isDirty && flushRef.current) {
      await flushRef.current()
    }
    console.log('switching to file id:', id)
    setCurrentFileId(id)
  }

  // Update sidebar title instantly
  function handleTitleChange(id, title) {
    setFiles((prev) =>
      prev.map((n) => (n._id === id ? { ...n, title } : n))
    )
  }


  useEffect(() => {
    if (!currentFileId) return
    console.log('currentFileId updated:', currentFileId)
  }, [currentFileId])

  return (
    <div className="app-wrapper">
      <TopBar title="Test Campaign" />

      <div className="layout-container">
        {/* Sidebar */}
        <FileSidebar
          campaignId={campaignId}
          files={files}
          setFiles={setFiles}
          currentfileId={currentFileId}
          onSelect={switchFile}
        />

        {/* Editor */}
        {currentFileId && (
          <MarkdownEditor
            campaignId={campaignId}
            currentFileId={currentFileId}
            onTitleChange={handleTitleChange}
            onDirtyChange={setIsDirty}
            registerFlush={(fn) => (flushRef.current = fn)}
          />
        )}
      </div>
    </div>
  )
}
