'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  markdownShortcutPlugin,
  UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
  MDXEditor,
  MDXEditorMethods,
  MDXEditorProps
} from '@mdxeditor/editor'

interface MarkdownEditorProps extends MDXEditorProps{
  noteId: string
  onTitleChange: (id: string, title: string) => void
  onDirtyChange: (dirty: boolean) => void
  registerFlush: (fn: () => Promise<void>) => void
  editorRef?: React.RefObject<MDXEditorMethods | null>;
}

interface Note {
  _id: string
  title: string
  content: string
  updatedAt: number
}

export default function MarkdownEditor({
  noteId,
  onTitleChange,
  onDirtyChange,
  registerFlush,
  editorRef,
  ...props
} : MarkdownEditorProps) {
  const [note, setNote] = useState<Note | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced save
  const debounceSave = useCallback((changes: Partial<Note>) => {
    onDirtyChange(true)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveNote(changes)
    }, 1200)
  }, [note])

  const flushSave = useCallback(async () => {
    if (!note) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    await saveNote(note)
  }, [note])

  useEffect(() => {
    registerFlush(flushSave)
  }, [flushSave])

  useEffect(() => {
    if (!noteId) return
    async function loadNote() {
      const res = await fetch(`/api/campaign/files/${noteId}`)
      const data: Note = await res.json()
      setNote(data)
      onDirtyChange(false)
    }
    loadNote()
  }, [noteId])

  async function saveNote(changes: Partial<Note>) {
    if (!note) return
    const payload = { ...note, ...changes, lastKnownUpdatedAt: note.updatedAt }
    const res = await fetch(`/api/campaign/files/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated: Note = await res.json()
    setNote(updated)
    onDirtyChange(false)
  }

  if (!note) return <div style={{ padding: 20 }}>Loading…</div>

  return (
    <div style={{ height: '100%', background: '#1e1e1e', color: 'white' }}>
      <input
        value={note.title || ''}
        onChange={(e) => {
          const title = e.target.value
          setNote({ ...note, title })
          onTitleChange(note._id, title)
          debounceSave({ title })
        }}
        style={{
          width: '100%',
          padding: '12px',
          background: '#1e1e1e',
          color: '#ffffff',
          border: 'none',
          borderBottom: '1px solid #333',
          fontSize: '20px',
          outline: 'none',
        }}
      />

      <MDXEditor
        key={note._id}
        markdown={note.content || ''}
        onChange={(md) => debounceSave({ content: md })}
        contentEditableClassName="mdx-editor"
        plugins={[
          // Example Plugin Usage
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          toolbarPlugin({
          toolbarClassName: 'my-classname',
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
            </>
          )
        }),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin()
        ]}
        {...props}
        ref={editorRef}
      />
    </div>
  )
}
