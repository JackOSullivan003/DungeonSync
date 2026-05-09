'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileSidebar from '@/components/FileSidebar'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import Chat from '@/components/Chat'
import Initiative from '@/components/Initiative'
import ImagePreviewPanel from '@/components/ImagePreview'
import LeftSidebar from '@/components/LeftSidebar'
import { getAblyClient, destroyAblyClient } from '@/lib/ably'

const TABS = [
  { id: 'sidebar',    type: 'sidebar',    label: '📁 Files' },
  { id: 'editor',     type: 'editor',     label: '📝 Editor' },
  { id: 'chat',       type: 'chat',       label: '💬 Chat' },
  { id: 'initiative', type: 'initiative', label: '⚔️ Initiative' },
]

const DEFAULT_WIDTHS = {
  sidebar: 280,
  editor: null,
  chat: 280,
  initiative: 280,
}

const MIN_WIDTH = 160

function Divider({ onDrag }) {
  const dragging = useRef(false)

  function onMouseDown(e) {
    e.preventDefault()
    dragging.current = true

    function onMouseMove(e) {
      if (!dragging.current) return
      onDrag(e.movementX)
    }

    function onMouseUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 4,
        flexShrink: 0,
        background: '#3a3a3a',
        cursor: 'col-resize',
        transition: 'background 0.15s',
        zIndex: 10,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#c0392b')}
      onMouseLeave={e => (e.currentTarget.style.background = '#3a3a3a')}
    />
  )
}

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
                onMouseEnter={e => (e.currentTarget.style.color = '#e74c3c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
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

export default function CampaignPage({ user }) {
  const params = useParams()
  const campaignId = params.campaignid
  const router = useRouter()

  const [campaign, setCampaign] = useState(null)
  const [campaignTitle, setCampaignTitle] = useState('Loading…')
  const [editingTitle, setEditingTitle] = useState(false)

  const [files, setFiles] = useState([])
  const [currentFileId, setCurrentFileId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const isDM = campaign?.dmId?.toString() === user?.id

  const flushRef = useRef(null)
  const containerRef = useRef(null)

  const [openTabIds, setOpenTabIds] = useState(['sidebar', 'editor', 'chat'])
  const [widths, setWidths] = useState({
    sidebar: 280,
    editor: null,
    chat: 280,
    initiative: 280,
  })

  // Session color lifted into state so it can be passed to MarkdownEditor
  const [sessionColor] = useState(() => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 85%, 60%)`
  })

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
 
  //ably presence useEffect
  useEffect(() => {
    if (!campaignId || !user?.id) return
 
    const ably = getAblyClient()

    const enter = () => {
      const channel = ably.channels.get(`campaign:${campaignId}:presence`)
      channel.presence.enter({ userId: user.id, color: sessionColor }, (err) => {
        if (err) console.error('Presence enter error:', err)
      })
    }
 
    if (ably.connection.state === 'connected') {
      enter()
    } else {
      ably.connection.once('connected', enter)
    }
 
    return () => {
      destroyAblyClient()
    }
  }, [campaignId, user?.id, sessionColor])
  

  async function saveCampaignTitle() {
    setEditingTitle(false)
    await fetch(`/api/campaign/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: campaignTitle }),
    })
  }

  function openTab(tabId) {
    setOpenTabIds(prev => {
      if (prev.includes(tabId)) return prev

      if (tabId !== 'editor') {
        setWidths(w => {
          const newWidth = DEFAULT_WIDTHS[tabId] ?? 280
          const container = containerRef.current

          if (prev.includes('editor')) {
            const totalFixed = Object.entries(w)
              .filter(([id]) => prev.includes(id) && id !== 'editor')
              .reduce((sum, [, width]) => sum + (width ?? 0), 0)
            const dividerCount = prev.length
            const editorWidth = (container?.clientWidth ?? 1000) - totalFixed - dividerCount * 4
            const newEditorWidth = Math.max(MIN_WIDTH, editorWidth - newWidth)
            return { ...w, [tabId]: newWidth, editor: newEditorWidth }
          }

          const donor = prev[prev.length - 1]
          if (donor) {
            const donorWidth = w[donor] ?? DEFAULT_WIDTHS[donor] ?? 280
            const newDonorWidth = Math.max(MIN_WIDTH, donorWidth - newWidth)
            return { ...w, [tabId]: newWidth, [donor]: newDonorWidth }
          }

          return { ...w, [tabId]: newWidth }
        })
      }

      return [...prev, tabId]
    })
  }

  function closeTab(tabId) {
    setOpenTabIds(prev => {
      const next = prev.filter(id => id !== tabId)
      if (next.length === 0) return next

      setWidths(w => {
        const container = containerRef.current
        const containerWidth = container?.clientWidth ?? 1000

        let closedWidth
        if (tabId === 'editor' && w.editor == null) {
          const totalFixed = Object.entries(w)
            .filter(([id]) => prev.includes(id) && id !== 'editor')
            .reduce((sum, [, width]) => sum + (width ?? 0), 0)
          const dividerCount = prev.length - 1
          closedWidth = containerWidth - totalFixed - dividerCount * 4
        } else {
          closedWidth = w[tabId] ?? DEFAULT_WIDTHS[tabId] ?? 280
        }

        const share = Math.floor(closedWidth / next.length)
        const updated = { ...w }

        next.forEach((id) => {
          if (id === 'editor' && updated.editor == null) {
            const totalFixed = Object.entries(updated)
              .filter(([sid]) => next.includes(sid) && sid !== 'editor')
              .reduce((sum, [, width]) => sum + (width ?? 0), 0)
            const dividerCount = next.length - 1
            const editorWidth = containerWidth - totalFixed - dividerCount * 4
            updated.editor = editorWidth + share
          } else {
            updated[id] = (updated[id] ?? DEFAULT_WIDTHS[id] ?? 280) + share
          }
        })

        updated[tabId] = DEFAULT_WIDTHS[tabId] ?? 280

        if (next.length === 1 && next[0] === 'editor') {
          updated.editor = null
        }

        return updated
      })

      return next
    })
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

  function makeDragHandler(leftTabId, rightTabId) {
    return (deltaX) => {
      setWidths(prev => {
        const leftIsEditor = leftTabId === 'editor'
        const rightIsEditor = rightTabId === 'editor'

        if (leftIsEditor || rightIsEditor) {
          const container = containerRef.current
          if (!container) return prev

          const totalFixed = Object.entries(prev)
            .filter(([id]) => id !== 'editor' && openTabIds.includes(id))
            .reduce((sum, [, w]) => sum + (w ?? 0), 0)

          const dividerCount = openTabIds.length - 1
          const editorWidth = container.clientWidth - totalFixed - dividerCount * 4

          if (leftIsEditor) {
            const newEditorW = Math.max(MIN_WIDTH, editorWidth + deltaX)
            const newRightW = Math.max(MIN_WIDTH, (prev[rightTabId] ?? DEFAULT_WIDTHS[rightTabId] ?? 280) - deltaX)
            return { ...prev, editor: newEditorW, [rightTabId]: newRightW }
          } else {
            const newLeftW = Math.max(MIN_WIDTH, (prev[leftTabId] ?? DEFAULT_WIDTHS[leftTabId] ?? 280) + deltaX)
            const newEditorW = Math.max(MIN_WIDTH, editorWidth - deltaX)
            return { ...prev, [leftTabId]: newLeftW, editor: newEditorW }
          }
        }

        const newLeft = Math.max(MIN_WIDTH, (prev[leftTabId] ?? DEFAULT_WIDTHS[leftTabId] ?? 280) + deltaX)
        const newRight = Math.max(MIN_WIDTH, (prev[rightTabId] ?? DEFAULT_WIDTHS[rightTabId] ?? 280) - deltaX)
        return { ...prev, [leftTabId]: newLeft, [rightTabId]: newRight }
      })
    }
  }

  function getPanelStyle(tabId) {
    const w = widths[tabId]
    if (tabId === 'editor' && w == null) return { flex: 1 }
    return { width: w ?? DEFAULT_WIDTHS[tabId] ?? 280, flexShrink: 0 }
  }

  function renderPanel(tab) {
    switch (tab.type) {
      case 'sidebar':
        return <SidebarPanel campaignId={campaignId} files={files} setFiles={setFiles} isDM={isDM} campaign={campaign} currentFileId={currentFileId} onOpenFile={openFile} />

      case 'editor': {
        const activeFile = files.find(f => f._id === currentFileId)
        const fileType = activeFile?.fileType ?? 'markdown'
        if (fileType === 'image') return <ImagePreviewPanel currentFileId={currentFileId} />
        return (
            <MarkdownEditor
            campaignId={campaignId}
            currentFileId={currentFileId}
            fileFromSidebar={activeFile}
            onTitleChange={handleTitleChange}
            onDirtyChange={setIsDirty}
            registerFlush={(fn) => (flushRef.current = fn)}
            userId={user?.id}
            username={user?.username}
            presencecolor={sessionColor}
          />
        )
      }

      case 'chat':
        return <Chat campaignId={campaignId} userId={user?.id} gmId={campaign?.dmId?.toString()} />

      case 'initiative':
        return <Initiative isDM={isDM} />

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

      {/* Main area: LeftSidebar + panel grid */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left tool sidebar */}
        <LeftSidebar
          campaignId={campaignId}
          currentUserId={user?.id}
          isDM={isDM}
          gmId={campaign?.dmId?.toString()}
        />

        {/* Panel grid */}
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            background: '#1e1e1e',
            userSelect: 'none',
          }}
        >
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
              <div key={tab.id} style={{ display: 'contents' }}>
                {i > 0 && <Divider onDrag={makeDragHandler(openTabs[i - 1].id, tab.id)} />}
                <div style={{
                  ...getPanelStyle(tab.id),
                  minWidth: MIN_WIDTH,
                  minHeight: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {renderPanel(tab)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}