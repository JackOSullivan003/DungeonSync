'use client' // marks this as a client-side React component

import { useEffect } from 'react'
import FolderNode from './FolderNode' // component to render folders
import FileNode from './FileNode' // component to render files
import buildTree from '@/lib/Buildtreecomp' // helper to create tree structure for file & folder nodes
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder' // folder icon
import CreateNewFileIcon from '@mui/icons-material/NoteAdd' // file icon

export default function FileSidebar({ campaignId, files, setFiles, onSelect, currentFileId }) {
  
  async function loadData() {
    console.log('FileSidebar campaignId:', campaignId) // debug log
    if (!campaignId) return console.error('campaignId undefined') // stop if campaignId missing
    const res = await fetch(`/api/campaign/${campaignId}/files`) // fetch files for this campaign
    const data = await res.json()

    if (!Array.isArray(data)) {
      console.error("Expected files array, got:", data)
      setFiles([]) // fail-safe
      return
    }

    setFiles(data) // store files in parent state
  }

  useEffect(() => {
    loadData() // load files when campaignId changes
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
    setFiles((prev) => [...prev, created])   // add new file to state
    onSelect(created._id.toString()) // open new file
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
    setFiles((prev) => [...prev, created]) // add folder to state
  }

  
  async function onDeleteFile(id) {
    if (!confirm('Delete this item?')) return // ask user before deleting
    await fetch(`/api/files/${id}`, { method: 'DELETE' }) // delete from server
    setFiles((prev) => prev.filter((f) => f._id !== id)) // remove from state
    if (currentFileId === id) onSelect(null) // clear selection if deleted file was open
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

  const hasFiles = files.length > 0 // check if any files exist
  const tree = buildTree(files) // convert flat list into folder tree

  return (
    <div className="file-sidebar">
      <div className="file-sidebar-top-btns">
        <button onClick={() => onCreateFile(null)}>
          <CreateNewFileIcon /> {/* button to create file */}
        </button>
        <button onClick={() => onCreateFolder(null)}>
          <CreateNewFolderIcon /> {/* button to create folder */}
        </button>
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
          )
        )}
      </div>
    </div>
  )
}