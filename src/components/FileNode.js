'use client'

import { useRef, useState, useEffect } from 'react'
import FileIcon from '@mui/icons-material/Description'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LockIcon from '@mui/icons-material/Lock'

export default function FileNode({
  node,
  onSelect,
  currentFileId,
  onRenameFile,
  onDeleteFile,
  isDM,
  campaignPlayers, // array of player userIds (strings)
  onPermissionChange, // (fileId, visibleTo) => void
}) {
  const isActive = node._id === currentFileId
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(node.title)
  const [showPermissions, setShowPermissions] = useState(false)

  const menuRef = useRef(null)

  useEffect(() => { setTitle(node.title) }, [node.title])

  const handleRename = async () => {
    setIsRenaming(false)
    if (title !== node.title) await onRenameFile(node._id, title)
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
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
    const next = isGloballyVisible ? [] : 'all'
    onPermissionChange(node._id, next)
  }

  async function handleDownload() {
    // fetch latest content directly from API to ensure we get the saved version
    const res = await fetch(`/api/files/${node._id}`)
    if (!res.ok) return console.error('Failed to fetch file for download')
    const file = await res.json()

    const blob = new Blob([file.content || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.title || 'untitled'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }


  function togglePlayer(playerId) {
    const current = Array.isArray(visibleTo) ? visibleTo : []
    const next = current.includes(playerId)
      ? current.filter(id => id !== playerId)
      : [...current, playerId]
    onPermissionChange(node._id, next)
  }

  return (
    <div
      className={`file-sidebar-row file-sidebar-node ${isActive ? 'active' : ''} ${!isGloballyVisible ? 'file-hidden-from-players' : ''}`}
      onClick={() => onSelect(node._id)}
    >
      <div className="file-sidebar-label">
        <FileIcon fontSize="small" />
        {!isGloballyVisible && <LockIcon fontSize="small" className="file-lock-icon" />}

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
            setShowPermissions(false)
          }}
        >
          <MoreVertIcon fontSize="small" />
        </button>

        {menuOpen && !showPermissions && (
          <div className="file-sidebar-menu-popup">
            <button onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
              setTitle(node.title)
              setIsRenaming(true)
            }}>
              Rename
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                handleDownload()
              }}
            >
              Download
            </button>


            {isDM && (
              <button onClick={(e) => {
                e.stopPropagation()
                setShowPermissions(true)
              }}>
                Permissions…
              </button>
            )}

            <button onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
              onDeleteFile(node._id)
            }}>
              Delete
            </button>
          </div>
        )}

        {/* Permissions submenu */}
        {menuOpen && showPermissions && (
          <div className="file-sidebar-menu-popup file-permissions-popup" onClick={e => e.stopPropagation()}>
            <div className="permissions-header">
              <button className="permissions-back" onClick={(e) => {
                e.stopPropagation()
                setShowPermissions(false)
              }}>
                ← Permissions
              </button>
            </div>

            <label className="permission-row">
              <input
                type="checkbox"
                checked={isGloballyVisible}
                onChange={toggleGlobalVisibility}
              />
              Visible to all players
            </label>

            {!isGloballyVisible && campaignPlayers.length === 0 && (
              <p className="permissions-empty">No players in campaign</p>
            )}

            {!isGloballyVisible && campaignPlayers.map(playerId => {
              const allowed = Array.isArray(visibleTo) && visibleTo.includes(playerId)
              return (
                <label key={playerId} className="permission-row">
                  <input
                    type="checkbox"
                    checked={allowed}
                    onChange={() => togglePlayer(playerId)}
                  />
                  <span className="permission-player-id">{playerUsernames[playerId] ?? playerId.slice(-6)}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}