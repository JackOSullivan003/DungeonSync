'use client'

import { useState, useRef, useEffect } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PeopleIcon from '@mui/icons-material/People'
import { TTRPG_ICONS } from '@/lib/campaignIcons'

export default function CampaignCard({
  campaign,
  isGM,
  onOpen,
  onEdit,
  onDelete,
  onLeave,
  onGetInviteCode,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bgImage, setBgImage] = useState(null)
  const menuRef = useRef(null)

  // Load background image from Images API if backgroundImageId exists
  useEffect(() => {
    if (!campaign.backgroundImageId) return setBgImage(null)

    async function loadBg() {
      const res = await fetch(`/api/images/${campaign._id}/${campaign.backgroundImageId}`)
      if (!res.ok) return
      const data = await res.json()
      setBgImage(`data:${data.mimeType};base64,${data.data}`)
    }

    loadBg()
  }, [campaign.backgroundImageId, campaign._id])

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const IconComponent = campaign.iconName
    ? TTRPG_ICONS.find(i => i.name === campaign.iconName)?.icon
    : null

  // Use card color for description background, falling back to a dark default
  //use color-mix to darken the color for the description area 
  const descBg = campaign.cardColor
  ? `color-mix(in srgb, ${campaign.cardColor} 60%, black 40%)`
  : 'rgba(15,15,15,0.97)'

  return (
    <div className="campaign-card" onClick={onOpen}>

      {/* Banner area — background image + color overlay + icon */}
      <div
        className="campaign-card-banner"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundColor: campaign.cardColor ? undefined : '#2a2a2a',
        }}
      >
        {/* Color overlay on top of background image */}
        {campaign.cardColor && (
          <div
            className="campaign-card-color-overlay"
            style={{ background: campaign.cardColor }}
          />
        )}

        {/* Icon pinned to bottom-left corner of banner */}
        {IconComponent && (
          <div className="campaign-card-banner-icon">
            <IconComponent style={{ fontSize: 36 }} />
          </div>
        )}

        {/* Dot menu pinned to top-right */}
        <div ref={menuRef} className="campaign-card-menu-wrapper">
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
              {isGM && (
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit() }}>
                  Edit…
                </button>
              )}
              {isGM && (
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onGetInviteCode() }}>
                  Invite Players…
                </button>
              )}
              {isGM ? (
                <button className="danger" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}>
                  Delete Campaign
                </button>
              ) : (
                <button className="danger" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onLeave() }}>
                  Leave Campaign
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description area — title, GM, player count */}
      <div className="campaign-card-info" style={{ background: descBg }}>
        <div className="campaign-card-info-header">
          <h3 className="campaign-card-info-title">{campaign.title}</h3>
          <div className="campaign-card-info-meta">
            <span>{isGM ? 'GM: You' : `GM: ${campaign.gmUsername}`}</span>
            <span className="campaign-card-info-players">
              <PeopleIcon style={{ fontSize: 14 }} />
              {campaign.players?.length || 0}
            </span>
          </div>
        </div>
        {campaign.description && (
          <p className="campaign-card-info-description">{campaign.description}</p>
        )}
      </div>
    </div>
  )
}