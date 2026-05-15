'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import FolderNode from './FolderNode'
import FileNode from './FileNode'
import buildTree from '@/lib/Buildtreecomp'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import CreateNewFileIcon from '@mui/icons-material/NoteAdd'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { getAblyClient } from '@/lib/ably'

export default function FileSidebar({ campaignId, files, setFiles, onSelect, currentfileId, campaign, isDM }) {

  const [playerUsernames, setPlayerUsernames] = useState({})
  const uploadInputRef = useRef(null) 

  const campaignPlayers = useMemo(() =>
    campaign?.players?.map(p => p.toString()) ?? []
  , [campaign])

  function broadcastFilesChanged() {
    const ably = getAblyClient()
    const channel = ably.channels.get(`campaign:${campaignId}:presence`)
    channel.publish('files-changed', { triggeredBy: 'files-changed' })
  }


  async function onCreateFile(parentId = null) {
    if (!campaignId) return console.error('campaignId undefined')
    const res = await fetch(`/api/campaign/${campaignId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', parentId, nodeType: 'file', fileType: 'markdown' }),
    })
    const created = await res.json()
    setFiles(prev => [...prev, created])
    onSelect(created._id.toString())
    broadcastFilesChanged()
  }

  async function onCreateFolder(parentId = null) {
    if (!campaignId) return console.error('campaignId undefined')
    const res = await fetch(`/api/campaign/${campaignId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Folder', parentId, nodeType: 'folder' }),
    })
    const created = await res.json()
    setFiles(prev => [...prev, created])
    broadcastFilesChanged()
  }

  // File Upload - handles md, pdf and images
  async function onUploadFile(e) {
    const file = e.target.files?.[0]
    if (!file || !campaignId) return
    e.target.value = ''
 
    const ext = file.name.split('.').pop().toLowerCase()
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp']
 
    let fileType
    if (ext === 'md') fileType = 'markdown'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (imageExts.includes(ext)) fileType = 'image'
    else return console.error('Unsupported file type:', ext)
 
    const reader = new FileReader()
 
    reader.onload = async () => {
      let content
      let mimeType = null
 
      if (fileType === 'markdown') {
        // Plain text — store as-is
        content = reader.result
      } else {
        // Binary — store as base64
        content = reader.result.split(',')[1]
        mimeType = file.type
      }
 
      const title = file.name.replace(/\.[^.]+$/, '') // strip extension
 
      const res = await fetch(`/api/campaign/${campaignId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, parentId: null, nodeType: 'file', fileType, content, mimeType }),
      })
 
      const created = await res.json()
      setFiles(prev => [...prev, created])
      onSelect(created._id.toString())
      broadcastFilesChanged()
    }
 
    if (fileType === 'markdown') {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  }

  async function onDeleteFile(id) {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    setFiles(prev => prev.filter(f => f._id !== id))
    if (currentfileId?.toString() === id?.toString()) onSelect(null)
    broadcastFilesChanged()
  }

  async function onRenameFile(id, title) {
    await fetch(`/api/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
     // update title in parent state
    setFiles(prev =>
      prev.map(f => f._id === id ? { ...f, title } : f)
    )
    broadcastFilesChanged()
  }

  async function onPermissionChange(fileId, visibleTo) {
    await fetch(`/api/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibleTo })
    })
    setFiles(prev =>
      prev.map(f => f._id === fileId ? { ...f, visibleTo } : f)
    )
    broadcastFilesChanged()
  }

  useEffect(() => {
    async function fetchUsernames() {
      if (!campaignPlayers?.length) return
      const entries = await Promise.all(
        campaignPlayers.map(async id => {
          const res = await fetch(`/api/user/${id}`)
          const data = await res.json()
          return [id, data.username ?? id.slice(-6)]
        })
      )
      setPlayerUsernames(Object.fromEntries(entries))
    }
    fetchUsernames()
  }, [campaignPlayers])


  const hasFiles = files.length > 0 // check if any files exist
  const tree = buildTree(files) // convert flat list into folder tree

  return (
    <div className="file-sidebar">
      <div className="file-sidebar-top-btns">
        <button onClick={() => onCreateFile(null)} title="New file">
          <CreateNewFileIcon />
        </button>
        <button onClick={() => onCreateFolder(null)} title="New folder">
          <CreateNewFolderIcon />
        </button>
        <button onClick={() => uploadInputRef.current?.click()} title="Upload File">
          <UploadFileIcon />
        </button>
        {/* Hidden file input for PDF upload */}
        <input
          ref={uploadInputRef}
          type="file"
          accept=".md, .pdf, .png, .jpg, .jpeg, .wedp"
          style={{ display: 'none' }}
          onChange={onUploadFile}
        />
      </div>

      <hr />
     <div className="file-hierarchy-container">
        {!hasFiles ? (
          <div className="empty-files">
            <p>No files yet</p>
            <small>Create a file or folder to get started.</small>
          </div>
        ) : (
          tree.map((node) =>
            node.nodeType === 'folder' ? (
              <FolderNode
                key={node._id}
                node={node}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onRename={onRenameFile}
                onDelete={onDeleteFile}
                onSelect={onSelect}
                currentfileId={currentfileId}
                isDM={isDM}
                campaignPlayers={playerUsernames}
                onPermissionChange={onPermissionChange}
              />
            ) : (
              <FileNode
                key={node._id}
                node={node}
                onSelect={onSelect}
                currentfileId={currentfileId}
                onRenameFile={onRenameFile}
                onDeleteFile={onDeleteFile}
                isDM={isDM}
                campaignPlayers={playerUsernames}
                onPermissionChange={onPermissionChange}
              />
            )
          )
        )}
      </div>
    </div>
  )
}