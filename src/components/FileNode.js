'use client'

import { useState } from 'react'
import FileIcon from '@mui/icons-material/Description'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export default function FileNode({
  file,
  onSelect,
  currentNoteId,
  onRenameFile,
  onDeleteFile
}) {
  const isActive = file._id === currentNoteId
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(file.title)

  const handleRename = async () => {
    setIsRenaming(false)
    if (title !== file.title) {
      await onRenameFile(file._id, title)
    }
  }

  return (
    <div
      className={`file-sidebar-row file-sidebar-node ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(file._id)}
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
          />
        ) : (
          <span>{file.title}</span>
        )}
      </div>

      <div className="file-sidebar-menu">
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
                onDeleteFile(file._id)
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
