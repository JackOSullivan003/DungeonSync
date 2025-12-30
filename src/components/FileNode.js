'use client'

import { useRef, useState, useEffect } from 'react'
import FileIcon from '@mui/icons-material/Description'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export default function FileNode({
  node,
  onSelect,
  currentFileId,
  onRenameFile,
  onDeleteFile
}) {
  const isActive = node._id === currentFileId
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)

  const menuRef = useRef(null)

  const handleRename = async () => {
    setIsRenaming(false)
    if (title !== node.title) {
      await onRenameFile(node._id, title)
    }
  }

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      className={`file-sidebar-row file-sidebar-node ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(node._id)}
    >
      <div className="file-sidebar-label">
        <FileIcon fontSize="small" />

        {isRenaming ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%' }}
          />
        ) : (
          <span>{node.title}</span>
        )}
      </div>

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
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                setIsRenaming(true)
              }}
            >
              Rename
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                onDeleteFile(node._id)
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
