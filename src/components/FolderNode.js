'use client'

import { useState } from 'react'
import FileNode from './FileNode'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import NewFileIcon from '@mui/icons-material/NoteAdd'

export default function FolderNode({
  node,
  onCreateFile,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onSelect,
  currentNoteId,
  onDeleteFile
}) {
  const [expanded, setExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleRename = async () => {
    setIsRenaming(false)
    if (title !== node.title) {
      await onRenameFolder(node._id, title)
    }
  }

  return (
    <div>
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
            <span>{title}</span>
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
                  onClick={() => {
                    setMenuOpen(false)
                    onCreateFile(node._id)
                  }}
                >
                  <NewFileIcon fontSize="small" /> New File
                </button>   
                <button onClick={() => {
                    setMenuOpen(false)
                    onCreateFolder(node._id)
                  }}
                >
                  <CreateNewFolderIcon fontSize="small" /> New Folder
                </button>   
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

      {expanded && (
        <div style={{ paddingLeft: 16 }}>
          {node.folders?.map(folder => (
            <FolderNode key={folder._id} {...{
              node: folder,
              onCreateFile,
              onCreateFolder,
              onDeleteFolder,
              onRenameFolder,
              onSelect,
              currentNoteId,
              onDeleteFile
            }} />
          ))}

          {node.files?.map(file => (
            <FileNode
              key={file._id}
              file={file}
              onSelect={onSelect}
              currentNoteId={currentNoteId}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}
