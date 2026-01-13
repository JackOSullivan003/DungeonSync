'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileSidebar from '@/components/FileSidebar'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'

export default function CampaignPage({ params }) {

  //console.log(use(params))
  const campaignid = use(params).campaignid
  console.log("campaignPage campaignId: ", campaignid)

  const router = useRouter()

  const [campaignTitle, setCampaignTitle] = useState('Loading…')
  const [editingTitle, setEditingTitle] = useState(false)

  const [files, setFiles] = useState([])
  const [currentFileId, setCurrentFileId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const activeFile = files.find(f => f._id === currentFileId)

  const flushRef = useRef(null)

  // Load campaign
  useEffect(() => {
    async function loadCampaign() {
      const res = await fetch(`/api/campaign/${campaignid}`)
      const campaign = await res.json()
      console.log(campaign)
      setCampaignTitle(campaign.title)
    }

    loadCampaign()
  }, [campaignid])

  // Save campaign title
  async function saveCampaignTitle() {
    setEditingTitle(false)

    await fetch(`/api/campaign/${campaignid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: campaignTitle })
    })
  }

  // Safe file switch
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
      <TopBar
        left={
          <div>
            <button
                className="topbar-back-btn"
                onClick={() => router.push('/dashboard')}
              >
              ← Dashboard
            </button>
          </div>
        }
        Title={
          editingTitle ? (
            <input
              className="campaign-title-input"
              value={campaignTitle}
              autoFocus
              onChange={(e) => setCampaignTitle(e.target.value)}
              onBlur={saveCampaignTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveCampaignTitle()}
            />
          ) : (
            <span
              className="campaign-title-text"
              onClick={() => setEditingTitle(true)}
              title="Click to rename campaign"
            >
              {campaignTitle}
            </span>
          )
        }
        right={
            <ProfileMenu />
        }
      />

      <div className="layout-container">
        {/* Sidebar */}
        <FileSidebar
          campaignId={campaignid}
          files={files}
          setFiles={setFiles}
          currentfileId={currentFileId}
          onSelect={switchFile}
        />

        {/* Editor */}
        {currentFileId && (
          <MarkdownEditor
            campaignId={campaignid}
            currentFileId={currentFileId}
            fileFromSidebar={activeFile}
            onTitleChange={handleTitleChange}
            onDirtyChange={setIsDirty}
            registerFlush={(fn) => (flushRef.current = fn)}
          />
        )}
      </div>
    </div>
  )
}
