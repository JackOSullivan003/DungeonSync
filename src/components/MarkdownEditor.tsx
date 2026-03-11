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

import "@milkdown/crepe/theme/common/style.css"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  campaignId: string
  currentFileId: string | null
  fileFromSidebar?: { _id: string; title: string } | null
  onTitleChange?: (id: string, title: string) => void
  onDirtyChange?: (dirty: boolean) => void
  registerFlush?: (fn: () => Promise<void>) => void
}

interface FileData {
  _id: string
  title: string
  content: string
  updatedAt: number
}

// ─── Link normalizer ─────────────────────────────────────────────────────────

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

// ─── Toolbar ─────────────────────────────────────────────────────────────────

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
        // prevent editor blur before command fires
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

// ─── Inner editor (must be inside MilkdownProvider) ──────────────────────────

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
    const crepe = new Crepe({
      root,
      defaultValue: file.content || '',
    })

    crepe.editor.use(listener)
    crepe.editor.config((ctx) => {
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

    // Expose crepe to toolbar after mount
    crepe.create().then(() => onCrepeReady(crepe))

    return crepe
  }, [])

  return <Milkdown />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarkdownEditor({
  campaignId,
  currentFileId,
  fileFromSidebar,
  onTitleChange = () => {},
  onDirtyChange = () => {},
  registerFlush = () => {},
}: MarkdownEditorProps) {
  const [file, setFile] = useState<FileData | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [crepe, setCrepe] = useState<Crepe | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const fileRef = useRef<FileData | null>(null)

  useEffect(() => { fileRef.current = file }, [file])

  // ── Sync title from sidebar renames ──────────────────────────────────────
  useEffect(() => {
    if (!fileFromSidebar) return
    setFile(prev =>
      prev && prev._id === fileFromSidebar._id
        ? { ...prev, title: fileFromSidebar.title }
        : prev
    )
  }, [fileFromSidebar])

  // ── Save ─────────────────────────────────────────────────────────────────
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
      onDirtyChange(false)
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }, [onDirtyChange])

  const debounceSave = useCallback((changes: Partial<FileData>) => {
    onDirtyChange(true)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => saveFile(changes), 1200)
  }, [saveFile, onDirtyChange])

  const flushSave = useCallback(async () => {
    if (!fileRef.current) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    await saveFile(fileRef.current)
  }, [saveFile])

  useEffect(() => { registerFlush(flushSave) }, [flushSave, registerFlush])

  // ── Load file on ID change ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentFileId || !campaignId) return

    async function loadFile() {
      try {
        const res = await fetch(`/api/files/${currentFileId}`)
        if (!res.ok) throw new Error('File not found')
        const data: FileData = await res.json()
        setFile(data)
        fileRef.current = data
        setCrepe(null) // clear stale crepe ref while editor remounts
        onDirtyChange(false)
        setEditorKey(k => k + 1)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    }

    loadFile()
  }, [currentFileId, campaignId])

  // ── Download ──────────────────────────────────────────────────────────────
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

  if (!file) return <div style={{ padding: 20, color: '#aaa' }}>Loading…</div>

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