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
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  MDXEditor,
  MDXEditorMethods,
  MDXEditorProps
} from '@mdxeditor/editor'


interface MarkdownEditorProps extends MDXEditorProps {
  campaignId: string
  currentFileId: string | null
  fileFromSidebar
  onTitleChange?: (id: string, title: string) => void
  onDirtyChange?: (dirty: boolean) => void
  registerFlush?: (fn: () => Promise<void>) => void
  editorRef?: React.RefObject<MDXEditorMethods | null>
}

interface File {
  _id: string
  title: string
  content: string
  updatedAt: number
}

function normalizeMarkdownLinks(markdown: string): string {
  return markdown.replace(
    /\]\(([^)]+)\)/g,
    (match, url) => {
      // Already absolute or special
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/') ||
        url.startsWith('#')
      ) {
        return match
      }

      // Looks like a domain → force https
      if (/^[\w-]+\.[\w.-]+/.test(url)) {
        return `](https://${url})`
      }

      // Otherwise treat as internal route
      return `](/${url})`
    }
  )
}


export default function MarkdownEditor({
  campaignId,
  currentFileId,
  fileFromSidebar,
  onTitleChange = () => {},
  onDirtyChange = () => {},
  registerFlush = () => {},
  editorRef,
  ...props
}: MarkdownEditorProps) {
  const [file, setFile] = useState<File | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!fileFromSidebar) return
    setFile(prev =>
      prev && prev._id === fileFromSidebar._id
        ? { ...prev, title: fileFromSidebar.title }
        : prev
    )
  }, [fileFromSidebar])


  /** Save file to server */
  const saveFile = useCallback(
    async (changes: Partial<File>) => {
      if (!file) return

      // Only send fields that are allowed to change
      const payload = {
        ...changes,
        ...(changes.content
          ? { content: normalizeMarkdownLinks(changes.content) }
          : {}),
        lastKnownUpdatedAt: file.updatedAt,
      }


      try {
        const res = await fetch(`/api/files/${file._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Failed to save file')

        const updated: File = await res.json()
        setFile(updated)
        onDirtyChange(false)
      } catch (err) {
        console.error('Failed to save file:', err)
      }
    },
    [file, onDirtyChange]
  )

  /** Debounced save */
  const debounceSave = useCallback(
    (changes: Partial<File>) => {
      onDirtyChange(true)
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(() => saveFile(changes), 1200)
    },
    [saveFile, onDirtyChange]
  )

  /** Flush pending changes */
  const flushSave = useCallback(async () => {
    if (!file) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    await saveFile(file)
  }, [file, saveFile])

  /** Register flush with parent */
  useEffect(() => {
    registerFlush(flushSave)
  }, [flushSave, registerFlush])

  /** Load file whenever currentFileId changes */
  useEffect(() => {
    if (!currentFileId || !campaignId) return

    async function loadFile() {
      try {
        console.log('Loading file for id:', currentFileId)
        const res = await fetch(`/api/files/${currentFileId}`)
        if (!res.ok) throw new Error('File not found')
        const data: File = await res.json()
        setFile(data)
        onDirtyChange(false)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    }

    loadFile()
  }, [currentFileId, campaignId, onDirtyChange])

  if (!file) return <div style={{ padding: 20 }}>Loading…</div>

  return (
    <div style={{ height: '100%', background: '#1e1e1e', color: 'white' }}>
      <input
        value={file.title ?? ''}
        onChange={(e) => {
          const title = e.target.value
          setFile({ ...file!, title })
          onTitleChange(file._id, title)
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
        key={file._id} // ensures editor refreshes on new file
        markdown={file.content || ''}
        onChange={(md) => {
          const normalized = normalizeMarkdownLinks(md)
          
          // Update local state immediately
          setFile((prev) =>
            prev ? { ...prev, content: normalized } : prev
        )
        
        debounceSave({ content: normalized })
      }}
      contentEditableClassName="mdxeditor-content"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
              </>
            ),
          }),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin(),
        ]}
        trim={false}
        {...props}
        ref={editorRef}
      />
    </div>
  )
}
