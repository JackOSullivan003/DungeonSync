'use client'

import { useState, useRef, useEffect } from 'react'
import FileNode from './FileNode'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import NewFileIcon from '@mui/icons-material/NoteAdd'

export default function FolderNode({
  node,
  onCreateNode,
  onDeleteNode,
  onRenameNode,
  onSelect,
  currentNoteId
}) {
  const [expanded, setExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef(null)

  const handleRename = async () => {
    setIsRenaming(false)
    if (title !== node.title) {
      await onRenameNode(node._id, title)
    }
  }

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
          onClick={() => setExpanded(!expanded)}
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

        {/* Menu */}
        <div ref={menuRef} className="file-sidebar-menu">
          <button
            className="file-sidebar-dots-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
          >
            <MoreVertIcon fontSize="small" />
          </button>

          {menuOpen && (
            <div className="file-sidebar-menu-popup">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onCreateNode({
                    parentId: node._id,
                    nodeType: 'file'
                  })
                }}
              >
                <NewFileIcon fontSize="small" /> New File
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onCreateNode({
                    parentId: node._id,
                    nodeType: 'folder'
                  })
                }}
              >
                <CreateNewFolderIcon fontSize="small" /> New Folder
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  setIsRenaming(true)
                }}
              >
                Rename
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDeleteNode(node._id)
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
                onCreateNode={onCreateNode}
                onDeleteNode={onDeleteNode}
                onRenameNode={onRenameNode}
                onSelect={onSelect}
                currentFileId={currentFileId}
              />
            ) : (
              <FileNode
                key={child._id}
                node={child}
                onSelect={onSelect}
                currentFileId={currentFileId}
                onRenameNode={onRenameNode}
                onDeleteNode={onDeleteNode}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
