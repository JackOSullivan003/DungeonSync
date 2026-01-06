'use client'

import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useState, useRef, useEffect } from 'react'

export default function CampaignCard({
  campaign,
  isDM,
  onOpen,
  onEdit,
  onDeleteOrLeave,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div
      className="campaign-card"
      onClick={onOpen}
      style={{
        backgroundImage: `url(${campaign.coverImage || '/placeholder.jpg'})`
      }}
    >
      <div className="campaign-card-overlay">
        <div className="campaign-card-header">
          <h3>{campaign.title}</h3>

          <div ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
            >
              <MoreVertIcon />
            </button>

            {menuOpen && (
              <div className="campaign-card-menu">
                {isDM && (
                  <button onClick={onEdit}>Edit</button>
                )}
                <button onClick={onDeleteOrLeave}>
                  {isDM ? 'Delete' : 'Leave'}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="campaign-card-description">
          {campaign.description || 'No description'}
        </p>

        <div className="campaign-card-footer">
          <span>{isDM ? 'DM: You' : 'Player'}</span>
          <span>{campaign.players.length + 1} players</span>
        </div>
      </div>
    </div>
  )
}
