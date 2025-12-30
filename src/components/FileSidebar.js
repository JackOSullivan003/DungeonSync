'use client'

import { useEffect } from 'react'
import FolderNode from './FolderNode'
import FileNode from './FileNode'
import buildTree from '@/lib/Buildtreecomp'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import CreateNewFileIcon from '@mui/icons-material/NoteAdd'

export default function FileSidebar({ campaignId, files, setFiles, onSelect, currentFileId }) {
  
  async function loadData() {
    console.log('FileSidebar campaignId:', campaignId)
    if (!campaignId) return
    const res = await fetch(`/api/campaign/${campaignId}/files`)
    const data = await res.json()
    setFiles(data)
  }

  useEffect(() => {
    loadData()
  }, [campaignId])

  async function onCreateFile(parentId = null) {
    if (!campaignId) return console.error('campaignId undefined')
    const res = await fetch(`/api/campaign/${campaignId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Untitled',
        parentId,
        nodeType: 'file',
        fileType: 'markdown'
      })
    })
    const created = await res.json()
    setFiles((prev) => [...prev, created])   // append new file to parent state
    onSelect(created._id.toString())
  }

  async function onCreateFolder(parentId = null) {
    if (!campaignId) return console.error('campaignId undefined')

    const res = await fetch(`/api/campaign/${campaignId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Folder',
        parentId,
        nodeType: 'folder'
      })
    })

    const created = await res.json()
    setFiles((prev) => [...prev, created])
  }

  


  async function onDeleteFile(id) {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    setFiles((prev) => prev.filter((f) => f._id !== id)) // remove from parent state
    if (currentFileId === id) onSelect(null)
  }

  async function onRenameFile(id, title) {
    await fetch(`/api/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    // update title in parent state
    setFiles((prev) =>
      prev.map((f) => (f._id === id ? { ...f, title } : f))
    )
  }

  const tree = buildTree(files)

  return (
    <div className="file-sidebar">
      <div className="file-sidebar-top-btns">
        <button onClick={() => onCreateFile(null)}>
          <CreateNewFileIcon />
        </button>
        <button onClick={() => onCreateFolder(null)}>
          <CreateNewFolderIcon />
        </button>
      </div>

      <hr />

      <div className="file-hierarchy-container">
        {tree.map((node) =>
          node.nodeType === 'folder' ? (
            <FolderNode
              key={node._id}
              node={node}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRenameFile}
              onDelete={onDeleteFile}
              onSelect={onSelect}
              currentFileId={currentFileId}
            />
          ) : (
            <FileNode
              key={node._id}
              node={node}
              onSelect={onSelect}
              currentFileId={currentFileId}
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
            />
          )
        )}
      </div>
    </div>
  )
}
