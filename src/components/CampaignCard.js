'use client'

import { useState, useRef, useEffect } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export default function CampaignCard({
  campaign,
  isDM,
  userId,
  onOpen,
  onEdit,
  onDelete,
  onLeave,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
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
      style={{
        backgroundImage: campaign.backgroundImage
          ? `url(${campaign.backgroundImage})`
          : undefined,
      }}
      onClick={onOpen}
    >
      <div className="campaign-card-overlay">
        <div className="campaign-card-header">
          <h3>{campaign.title}</h3>

          <div ref={menuRef}>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
            >
              <MoreVertIcon />
            </button>

            {menuOpen && (
              <div className="campaign-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit()
                  }}
                >
                  Edit…
                </button>

                {isDM ? (
                  <button
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete()
                    }}
                  >
                    Delete Campaign
                  </button>
                ) : (
                  <button
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onLeave()
                    }}
                  >
                    Leave Campaign
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <p>{campaign.description || 'No description'}</p>

        <div className="campaign-card-footer">
          <span>{isDM ? 'DM: You' : 'Player'}</span>
          <span>{(campaign.players?.length || 0) + 1} players</span>
        </div>
      </div>
    </div>
  )
}
