'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import { Milkdown, useEditor, MilkdownProvider } from '@milkdown/react'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { callCommand } from '@milkdown/utils'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInHeadingCommand,
} from '@milkdown/kit/preset/commonmark'
import { undoCommand, redoCommand } from '@milkdown/kit/plugin/history'
import { editorViewCtx, prosePluginsCtx } from '@milkdown/core'
import { EditorView } from '@milkdown/prose/view'
import { getAblyClient } from '@/lib/ably'
import { getSpacesClient } from '@/lib/ablySpaces'
import { createLineLockPlugin, lineLockPluginKey } from '@/lib/lineLockPlugin'

import "@milkdown/crepe/theme/common/style.css"

// Types

interface MarkdownEditorProps {
  campaignId: string
  currentFileId: string | null
  fileFromSidebar?: { _id: string; title: string } | null
  onTitleChange?: (id: string, title: string) => void
  onDirtyChange?: (dirty: boolean) => void
  registerFlush?: (fn: () => Promise<void>) => void
  userId: string
  username: string
  presenceColor: string
}

interface FileData {
  _id: string
  title: string
  content: string
  updatedAt: number
}

// Link normalizer

function normalizeMarkdownLinks(markdown: string): string {
  return markdown.replace(
    /\]\(([^)]+)\)/g,
    (match, url) => {
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/') ||
        url.startsWith('#')
      ) {
        return match
      }
      if (/^[\w-]+\.[\w.-]+/.test(url)) {
        return `](https://${url})`
      }
      return `](/${url})`
    }
  )
}

// Resolve which top-level block index a ProseMirror position falls in

function getBlockIndex(doc: any, pos: number): number {
  let offset = 0
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i)
    const childStart = offset + 1
    const childEnd = offset + child.nodeSize
    if (pos >= childStart && pos <= childEnd) return i
    offset += child.nodeSize
  }
  return 0
}

// Toolbar

function Toolbar({
  crepe,
  onDownload,
}: {
  crepe: Crepe | null
  onDownload: () => void
}) {
  function run(command: Parameters<typeof callCommand>[0], payload?: unknown) {
    if (!crepe) return
    crepe.editor.action(callCommand(command, payload as never))
  }

  const btn = (label: string, onClick: () => void, title?: string) => (
    <button
      key={label}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title ?? label}
      style={{
        background: 'none',
        border: '1px solid transparent',
        color: '#ccc',
        borderRadius: 4,
        padding: '3px 8px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        lineHeight: 1.4,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3a3a'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#ccc'
      }}
    >
      {label}
    </button>
  )

  const divider = (key: string) => (
    <div key={key} style={{ width: 1, background: '#3a3a3a', margin: '4px 6px', alignSelf: 'stretch' }} />
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '6px 10px',
      background: '#2a2a2a',
      borderBottom: '1px solid #3a3a3a',
      flexWrap: 'wrap',
    }}>
      {btn('↩', () => run(undoCommand.key), 'Undo')}
      {btn('↪', () => run(redoCommand.key), 'Redo')}
      {divider('d1')}
      {btn('H1', () => run(wrapInHeadingCommand.key, 1), 'Heading 1')}
      {btn('H2', () => run(wrapInHeadingCommand.key, 2), 'Heading 2')}
      {btn('H3', () => run(wrapInHeadingCommand.key, 3), 'Heading 3')}
      {divider('d2')}
      {btn('B', () => run(toggleStrongCommand.key), 'Bold')}
      {btn('I', () => run(toggleEmphasisCommand.key), 'Italic')}
      {divider('d3')}
      <button
        onMouseDown={(e) => { e.preventDefault(); onDownload() }}
        title="Download as .md"
        style={{
          background: 'none',
          border: 'none',
          color: '#aaa',
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: '0.8rem',
          whiteSpace: 'nowrap',
        }}
      >
        ↓ .md
      </button>
    </div>
  )
}

// Inner editor

function EditorInner({
  file,
  fileRef,
  onDirtyChange,
  debounceSave,
  onCrepeReady,
}: {
  file: FileData
  fileRef: React.MutableRefObject<FileData | null>
  onDirtyChange: (dirty: boolean) => void
  debounceSave: (changes: Partial<FileData>) => void
  onCrepeReady: (crepe: Crepe) => void
}) {
  useEditor((root) => {
    const lineLockPlugin = createLineLockPlugin()

    const crepe = new Crepe({
      root,
      defaultValue: file.content || '',
    })

    crepe.editor.use(listener)

    crepe.editor.config((ctx) => {
      const plugins = ctx.get(prosePluginsCtx)
      ctx.set(prosePluginsCtx, [...plugins, lineLockPlugin])

      const l = ctx.get(listenerCtx)
      l.markdownUpdated((_, markdown, prevMarkdown) => {
        if (markdown === prevMarkdown) return
        const normalized = normalizeMarkdownLinks(markdown)
        if (fileRef.current) {
          fileRef.current = { ...fileRef.current, content: normalized }
          debounceSave({ content: normalized })
        }
      })
    })

    crepe.create().then(() => onCrepeReady(crepe))

    return crepe
  }, [])

  return <Milkdown />
}

// Main component

export default function MarkdownEditor({
  campaignId,
  currentFileId,
  fileFromSidebar,
  onTitleChange = () => {},
  onDirtyChange = () => {},
  registerFlush = () => {},
  username,
  presenceColor,
}: MarkdownEditorProps) {
  const [file, setFile] = useState<FileData | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [crepe, setCrepe] = useState<Crepe | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastPublishedContentRef = useRef<string | null>(null)
  const fileRef = useRef<FileData | null>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const spaceRef = useRef<any>(null)
  const campaignIdRef = useRef<string>(campaignId)
  const lastBlockRef = useRef<number>(-1)
  const lockMapRef = useRef<Record<number, { username: string; color: string }>>({})

  useEffect(() => { fileRef.current = file }, [file])
  useEffect(() => { crepeRef.current = crepe }, [crepe])
  useEffect(() => { campaignIdRef.current = campaignId }, [campaignId])

  // Sync title from sidebar renames
  useEffect(() => {
    if (!fileFromSidebar) return
    setFile(prev =>
      prev && prev._id === fileFromSidebar._id
        ? { ...prev, title: fileFromSidebar.title }
        : prev
    )
  }, [fileFromSidebar])

  // Dispatch lock map into the ProseMirror plugin
  const applyLockMap = useCallback((lockMap: Record<number, { username: string; color: string }>) => {
    lockMapRef.current = lockMap
    const c = crepeRef.current
    if (!c) return
    try {
      c.editor.action((ctx) => {
        const editorView = ctx.get(editorViewCtx) as EditorView
        const tr = editorView.state.tr.setMeta(lineLockPluginKey, { lockMap })
        editorView.dispatch(tr)
      })
    } catch {
      // editor not ready yet
    }
  }, [])

  // Rebuild full lock map from all current space members
  const rebuildFromMembers = useCallback(async (space: any) => {
    try {
      const members = await space.members.getAll()
      const map: Record<number, { username: string; color: string }> = {}
      for (const member of members) {
        if (member.profileData?.username === username) continue
        const blockIndex = member.location?.blockIndex
        if (blockIndex == null) continue
        map[blockIndex] = {
          username: member.profileData?.username ?? 'Unknown',
          color: member.profileData?.color ?? '#888888',
        }
      }
      applyLockMap(map)
    } catch {
      // space not ready yet
    }
  }, [username, applyLockMap])

  // Save helpers
  const saveFile = useCallback(async (changes: Partial<FileData>) => {
    const current = fileRef.current
    if (!current) return
    const payload = {
      ...changes,
      ...(changes.content ? { content: normalizeMarkdownLinks(changes.content) } : {}),
      lastKnownUpdatedAt: current.updatedAt,
    }
    try {
      const res = await fetch(`/api/files/${current._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated: FileData = await res.json()
      fileRef.current = updated
      setFile(updated)
      if (Object.prototype.hasOwnProperty.call(changes, 'title')) {
        const ably = getAblyClient()
        const channel = ably.channels.get(`campaign:${campaignIdRef.current}:presence`)
        channel.publish('files-changed', { triggeredBy: 'editor-title-change' }).catch(() => {})
      }
      onDirtyChange(false)
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }, [onDirtyChange])

  const debounceSave = useCallback((changes: Partial<FileData>) => {
    onDirtyChange(true)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      const current = fileRef.current
      const fileId = current?._id
      if (current && fileId && changes.content) {
        const ably = getAblyClient()
        const channel = ably.channels.get(`campaign:${campaignIdRef.current}:file:${fileId}`)
        channel.publish('content', {
          content: changes.content,
          updatedAt: Date.now(),
        }).catch(() => {})
        lastPublishedContentRef.current = changes.content
      }
      saveFile(changes)
    }, 1200)
  }, [saveFile, onDirtyChange])

  const flushSave = useCallback(async () => {
    if (!fileRef.current) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    await saveFile(fileRef.current)
  }, [saveFile])

  useEffect(() => { registerFlush(flushSave) }, [flushSave, registerFlush])

  // Clear file when deselected
  useEffect(() => {
    if (!currentFileId) {
      setFile(null)
      setCrepe(null)
      setEditorKey(k => k + 1)
    }
  }, [currentFileId])

  // Ably Spaces: enter space on file open, subscribe to location updates
  useEffect(() => {
    if (!currentFileId || !campaignId || !username) return

    const spaceName = `file-${currentFileId}`
    let space: any = null
    let active = true

    async function enterSpace() {
      try {
        const spaces = getSpacesClient()
        space = await spaces.get(spaceName)
        if (!active) return

        await space.enter({ username, color: presenceColor })
        if (!active) return

        spaceRef.current = space

        space.members.subscribe('update', () => {
          if (active) rebuildFromMembers(space)
        })

        space.locations.subscribe('update', () => {
          if (active) rebuildFromMembers(space)
        })

        rebuildFromMembers(space)
      } catch (err) {
        console.error('Space enter error:', err)
      }
    }

    enterSpace()

    return () => {
      active = false
      if (space) {
        space.members.unsubscribe()
        space.locations.unsubscribe()
        space.leave().catch(() => {})
      }
      spaceRef.current = null
      lastBlockRef.current = -1
      applyLockMap({})
    }
  }, [currentFileId, campaignId, username, presenceColor])

  // Re-apply lock map when crepe remounts after a file switch
  useEffect(() => {
    if (!crepe || !spaceRef.current) return
    rebuildFromMembers(spaceRef.current)
  }, [crepe, rebuildFromMembers])

  // Ably pub/sub: receive content updates from other users
  // Remounts the editor so remote markdown changes become visible.
  useEffect(() => {
    if (!currentFileId || !campaignId) return

    const ably = getAblyClient()
    const channel = ably.channels.get(`campaign:${campaignId}:file:${currentFileId}`)

    channel.subscribe('content', (msg: any) => {
      const { content, updatedAt } = msg.data
      if (!content || !fileRef.current) return

      if (content === lastPublishedContentRef.current || content === fileRef.current.content) {
        return
      }

      const updatedFile = {
        ...fileRef.current,
        content,
        updatedAt: updatedAt ?? fileRef.current.updatedAt,
      }

      fileRef.current = updatedFile
      setFile(updatedFile)
      setEditorKey(k => k + 1)
      onDirtyChange(false)
    })

    return () => {
      channel.unsubscribe('content')
    }
  }, [currentFileId, campaignId])

  // RAF loop: track cursor block and update Spaces location
  useEffect(() => {
    if (!crepe) return
    let rafId: number
    let active = true

    function poll() {
      if (!active) return
      try {
        crepe.editor.action((ctx) => {
          const editorView = ctx.get(editorViewCtx) as EditorView
          const { doc, selection } = editorView.state
          const blockIndex = getBlockIndex(doc, selection.$anchor.pos)
          if (blockIndex !== lastBlockRef.current) {
            lastBlockRef.current = blockIndex
            spaceRef.current?.locations.set({ blockIndex }).catch(() => {})
          }
        })
      } catch {
        // editor not ready, skip frame
      }
      rafId = requestAnimationFrame(poll)
    }

    rafId = requestAnimationFrame(poll)
    return () => {
      active = false
      cancelAnimationFrame(rafId)
    }
  }, [crepe])

  // Load file on ID change
  useEffect(() => {
    if (!currentFileId || !campaignId) return
    async function loadFile() {
      try {
        const res = await fetch(`/api/files/${currentFileId}`)
        if (!res.ok) throw new Error('File not found')
        const data: FileData = await res.json()
        setFile(data)
        fileRef.current = data
        setCrepe(null)
        onDirtyChange(false)
        setEditorKey(k => k + 1)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    }
    loadFile()
  }, [currentFileId, campaignId])

  // Download
  function handleDownload() {
    if (!file) return
    const blob = new Blob([file.content || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.title || 'untitled'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) return (
    <div style={{ padding: 20, color: '#aaa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {currentFileId ? 'Loading…' : 'Select a file in the Files tab to get started'}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <input
          value={file.title ?? ''}
          onChange={(e) => {
            const title = e.target.value
            setFile({ ...file, title })
            onTitleChange(file._id, title)
            debounceSave({ title })
          }}
          style={{
            flex: 1,
            padding: '12px',
            background: '#1e1e1e',
            color: '#ffffff',
            border: 'none',
            fontSize: '20px',
            outline: 'none',
          }}
        />
      </div>

      {/* Toolbar */}
      <Toolbar crepe={crepe} onDownload={handleDownload} />

      {/* Milkdown Crepe editor */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MilkdownProvider>
          <EditorInner
            key={editorKey}
            file={file}
            fileRef={fileRef}
            onDirtyChange={onDirtyChange}
            debounceSave={debounceSave}
            onCrepeReady={setCrepe}
          />
        </MilkdownProvider>
      </div>

    </div>
  )
}
