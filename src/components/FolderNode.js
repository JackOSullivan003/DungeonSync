'use client'

import { useState, useRef, useEffect } from 'react'
import FileNode from './FileNode'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import NewFileIcon from '@mui/icons-material/NoteAdd'

//css for this component is in FileSidebarStyle as the FileSidebar is the only place where this component is used

export default function FolderNode({
  node,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onSelect,
  currentFileId
}) {
  const [expanded, setExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef(null)

  /* Sync title when parent updates */
  useEffect(() => {
    setTitle(node.title)
  }, [node.title])

  /* Handle rename */
  async function handleRename() {
    setIsRenaming(false)
    if (title.trim() && title !== node.title) {
      await onRename(node._id, title)
    } else {
      setTitle(node.title)
    }
  }

  /* Close menu on outside click */
  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div>
      {/* Folder row */}
      <div className="file-sidebar-row file-sidebar-node">
        <div
          className="file-sidebar-label"
          onClick={() => setExpanded((v) => !v)}
        >
          <FolderIcon fontSize="small" />

          {isRenaming ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{node.title}</span>
          )}
        </div>

        {/* Context menu */}
        <div ref={menuRef} className="file-sidebar-menu">
          <button
            className="file-sidebar-dots-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <MoreVertIcon fontSize="small" />
          </button>

          {menuOpen && (
            <div className="file-sidebar-menu-popup">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onCreateFile(node._id)
                  setExpanded(true)
                }}
              >
                <NewFileIcon fontSize="small" /> New File
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onCreateFolder(node._id)
                  setExpanded(true)
                }}
              >
                <CreateNewFolderIcon fontSize="small" /> New Folder
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  setTitle(node.title)
                  setIsRenaming(true)
                }}
              >
                Rename
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(node._id)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && node.children?.length > 0 && (
        <div style={{ paddingLeft: 16 }}>
          {node.children.map((child) =>
            child.nodeType === 'folder' ? (
              <FolderNode
                key={child._id}
                node={child}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onRename={onRename}
                onDelete={onDelete}
                onSelect={onSelect}
                currentFileId={currentFileId}
              />
            ) : (
              <FileNode
                key={child._id}
                node={child}
                onSelect={onSelect}
                currentFileId={currentFileId}
                onRenameFile={onRename}
                onDeleteFile={onDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
