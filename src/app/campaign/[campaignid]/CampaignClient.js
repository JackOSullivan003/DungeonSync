'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileSidebar from '@/components/FileSidebar'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'

// TAB list 
const TABS = [
  { id: 'sidebar',    type: 'sidebar',    label: '📁 Files' },
  { id: 'editor',     type: 'editor',     label: '📝 Editor' },
  { id: 'chat',       type: 'chat',       label: '💬 Chat' },
  { id: 'initiative', type: 'initiative', label: '⚔️ Initiative' },
]

// ─── Panel renderers 

function SidebarPanel({ campaignId, files, setFiles, isDM, campaign, onOpenFile, currentFileId }) {
  return (
    <FileSidebar
      campaignId={campaignId}
      files={files}
      setFiles={setFiles}
      currentfileId={currentFileId} 
      onSelect={onOpenFile}
      isDM={isDM}
      campaign={campaign}
    />
  )
}

function ChatPanel() {
  return (
    <div style={{ padding: 24, color: '#aaa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Chat coming soon…</p>
    </div>
  )
}

function InitiativePanel() {
  return (
    <div style={{ padding: 24, color: '#aaa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Initiative tracker coming soon…</p>
    </div>
  )
}

// ─── Tab bar

function TabBar({ tabs, openTabIds, onOpen, onClose }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '0 10px',
      background: '#222',
      borderBottom: '1px solid #3a3a3a',
      overflowX: 'auto',
      flexShrink: 0,
      height: 38,
    }}>
      {tabs.map(tab => {
        const isOpen = openTabIds.includes(tab.id)
        return (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: 30,
              borderRadius: 4,
              background: isOpen ? '#2a2a2a' : 'none',
              border: isOpen ? '1px solid #3a3a3a' : '1px solid transparent',
              color: isOpen ? '#fff' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.82rem',
              userSelect: 'none',
              flexShrink: 0,
            }}
            onClick={() => onOpen(tab.id)}
          >
            <span>{tab.label}</span>
            {isOpen && (
              <span
                onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
                style={{
                  fontSize: 10,
                  color: '#666',
                  lineHeight: 1,
                  padding: '1px 2px',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                ✕
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component

export default function CampaignPage({ user }) {
  const params = useParams()
  const campaignId = params.Campaignid
  const router = useRouter()

  const [campaign, setCampaign] = useState(null)
  const [campaignTitle, setCampaignTitle] = useState('Loading…')
  const [editingTitle, setEditingTitle] = useState(false)

  const [files, setFiles] = useState([])
  const [currentFileId, setCurrentFileId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const isDM = campaign?.dmId?.toString() === user?.id

  const flushRef = useRef(null)

  const [openTabIds, setOpenTabIds] = useState(['sidebar', 'editor', 'chat'])

  // ── Load campaign
  useEffect(() => {
    if (!campaignId) return
    async function loadCampaign() {
      const res = await fetch(`/api/campaign/${campaignId}`)
      const data = await res.json()
      setCampaign(data)
      setCampaignTitle(data.title)
    }
    loadCampaign()
  }, [campaignId])

  // ── Save campaign title
  async function saveCampaignTitle() {
    setEditingTitle(false)
    await fetch(`/api/campaign/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: campaignTitle }),
    })
  }

  // ── Tab management

  function openTab(tabId) {
    setOpenTabIds(prev => prev.includes(tabId) ? prev : [...prev, tabId])
  }

  function closeTab(tabId) {
    setOpenTabIds(prev => prev.filter(id => id !== tabId))
  }

  async function openFile(fileId) {
    if (fileId === null) {
      setCurrentFileId(null)
      return
    }
    if (isDirty && flushRef.current) await flushRef.current()
    setCurrentFileId(fileId)
    openTab('editor')
  }

  function handleTitleChange(id, title) {
    setFiles(prev => prev.map(n => n._id === id ? { ...n, title } : n))
  }

  // ── Render a single panel by tab type
  function renderPanel(tab) {
    switch (tab.type) {
      case 'sidebar':
        return <SidebarPanel campaignId={campaignId} files={files} setFiles={setFiles} isDM={isDM} campaign={campaign} currentFileId={currentFileId} onOpenFile={openFile}  />

      case 'editor': {
        const activeFile = files.find(f => f._id === currentFileId)
        const fileType = activeFile?.fileType ?? 'markdown'
        
        if (fileType === 'markdown'){
          return (
            <MarkdownEditor
            campaignId={campaignId}
            currentFileId={currentFileId}
            fileFromSidebar={activeFile}
            onTitleChange={handleTitleChange}
            onDirtyChange={setIsDirty}
            registerFlush={(fn) => (flushRef.current = fn)}
            />
          )
        }
        // if (fileType === 'pdf') {
          // return (
            // <PDFEditor
              // campaignId={campaignId}
              // currentFileId={currentFileId}
            // />
          // )
        // }
        else {
          console.log("no other editor availble, TO-DO: add pdf editor")
          return null
        }
      }

      case 'chat':
        return <ChatPanel />
      case 'initiative':
        return <InitiativePanel />
      default:
        return null
    }
  }

  const openTabs = TABS.filter(t => openTabIds.includes(t.id))
  const ready = !!campaignId && !!campaign

  return (
    <div className="app-wrapper">

      <TopBar
        left={
          <button className="primary" onClick={() => router.push('/dashboard')}>
            ← Dashboard
          </button>
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
              title="Click to rename"
            >
              {campaignTitle}
            </span>
          )
        }
        right={<ProfileMenu user={user} />}
      />

      <TabBar
        tabs={TABS}
        openTabIds={openTabIds}
        onOpen={openTab}
        onClose={closeTab}
      />

      {/* Panel grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        background: '#1e1e1e',
      }}>
        {openTabs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.9rem' }}>
            Open a tab above to get started
          </div>
        ) : !ready ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.9rem' }}>
            Loading…
          </div>
        ) : (
          openTabs.map((tab, i) => (
            <div
              key={tab.id}
              style={{
                flex: tab.type === 'editor' ? 1 : '0 0 280px',
                minWidth: 0,
                minHeight: 0,
                overflow: 'hidden',
                borderLeft: i > 0 ? '1px solid #3a3a3a' : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {renderPanel(tab)}
            </div>
          ))
        )}
      </div>

    </div>
  )
}