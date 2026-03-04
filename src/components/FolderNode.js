'use client'

import { useState, useRef, useEffect } from 'react'
import FileNode from './FileNode'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import NewFileIcon from '@mui/icons-material/NoteAdd'
import LockIcon from '@mui/icons-material/Lock'

export default function FolderNode({
  node,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onSelect,
  currentFileId,
  isDM,
  campaignPlayers,
  onPermissionChange,
}) {
  const [expanded, setExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)

  const menuRef = useRef(null)

  useEffect(() => { setTitle(node.title) }, [node.title])

  async function handleRename() {
    setIsRenaming(false)
    if (title.trim() && title !== node.title) {
      await onRename(node._id, title)
    } else {
      setTitle(node.title)
    }
  }

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setShowPermissions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const visibleTo = node.visibleTo ?? 'all'
  const isGloballyVisible = visibleTo === 'all'

  function toggleGlobalVisibility() {
    onPermissionChange(node._id, isGloballyVisible ? [] : 'all')
  }

  function togglePlayer(playerId) {
    const current = Array.isArray(visibleTo) ? visibleTo : []
    const next = current.includes(playerId)
      ? current.filter(id => id !== playerId)
      : [...current, playerId]
    onPermissionChange(node._id, next)
  }

  return (
    <div>
      <div className={`file-sidebar-row file-sidebar-node ${!isGloballyVisible ? 'file-hidden-from-players' : ''}`}>
        <div className="file-sidebar-label" onClick={() => setExpanded(v => !v)}>
          <FolderIcon fontSize="small" />
          {!isGloballyVisible && <LockIcon fontSize="small" className="file-lock-icon" />}

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

        <div ref={menuRef} className="file-sidebar-menu">
          <button
            className="file-sidebar-dots-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(v => !v)
              setShowPermissions(false)
            }}
          >
            <MoreVertIcon fontSize="small" />
          </button>

          {menuOpen && !showPermissions && (
            <div className="file-sidebar-menu-popup">
              <button onClick={() => { setMenuOpen(false); onCreateFile(node._id.toString()); setExpanded(true) }}>
                <NewFileIcon fontSize="small" /> New File
              </button>
              <button onClick={() => { setMenuOpen(false); onCreateFolder(node._id.toString()); setExpanded(true) }}>
                <CreateNewFolderIcon fontSize="small" /> New Folder
              </button>
              <button onClick={() => { setMenuOpen(false); setTitle(node.title); setIsRenaming(true) }}>
                Rename
              </button>

              {isDM && (
                <button onClick={(e) => { e.stopPropagation(); setShowPermissions(true) }}>
                  Permissions…
                </button>
              )}

              <button onClick={() => { setMenuOpen(false); onDelete(node._id) }}>
                Delete
              </button>
            </div>
          )}

          {menuOpen && showPermissions && (
            <div className="file-sidebar-menu-popup file-permissions-popup" onClick={e => e.stopPropagation()}>
              <div className="permissions-header">
                <button className="permissions-back" onClick={(e) => { e.stopPropagation(); setShowPermissions(false) }}>
                  ← Permissions
                </button>
              </div>

              <label className="permission-row">
                <input type="checkbox" checked={isGloballyVisible} onChange={toggleGlobalVisibility} />
                Visible to all players
              </label>

              {!isGloballyVisible && campaignPlayers.length === 0 && (
                <p className="permissions-empty">No players in campaign</p>
              )}

              {!isGloballyVisible && campaignPlayers.map(playerId => {
                const allowed = Array.isArray(visibleTo) && visibleTo.includes(playerId)
                return (
                  <label key={playerId} className="permission-row">
                    <input type="checkbox" checked={allowed} onChange={() => togglePlayer(playerId)} />
                    <span className="permission-player-id">{playerUsernames[playerId] ?? playerId.slice(-6)}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

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
                isDM={isDM}
                campaignPlayers={campaignPlayers}
                onPermissionChange={onPermissionChange}
              />
            ) : (
              <FileNode
                key={child._id}
                node={child}
                onSelect={onSelect}
                currentFileId={currentFileId}
                onRenameFile={onRename}
                onDeleteFile={onDelete}
                isDM={isDM}
                campaignPlayers={campaignPlayers}
                onPermissionChange={onPermissionChange}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}