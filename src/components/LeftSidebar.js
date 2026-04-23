'use client'

import { useState } from 'react'
import GroupIcon from '@mui/icons-material/Group'
import PlayersMenu from '@/components/PlayersMenu'

const TOOLS = [
  { id: 'players', label: 'Players', icon: GroupIcon },
]

export default function LeftSidebar({ campaignId, currentUserId, isDM, gmId }) {
  const [activeTool, setActiveTool] = useState(null)

  function toggleTool(toolId) {
    setActiveTool(prev => prev === toolId ? null : toolId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', flexShrink: 0 }}>

      {/* Icon rail */}
      <div style={{
        width: 48,
        background: '#222',
        borderRight: '1px solid #3a3a3a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        gap: 4,
        flexShrink: 0,
      }}>
        {TOOLS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTool === id
          return (
            <button
              key={id}
              onClick={() => toggleTool(id)}
              title={label}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: isActive ? '#3a3a3a' : 'none',
                border: isActive ? '1px solid #555' : '1px solid transparent',
                color: isActive ? '#fff' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#aaa' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#666' }}
            >
              <Icon fontSize="small" />
            </button>
          )
        })}
      </div>

      {/* Tool panel — always mounted, visibility toggled via display */}
      <div style={{
        width: activeTool ? 240 : 0,
        borderRight: activeTool ? '1px solid #3a3a3a' : 'none',
        background: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.15s',
      }}>
        {/* Always mounted so useEffects run on page load */}
        <div style={{ display: activeTool === 'players' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <PlayersMenu
            campaignId={campaignId}
            currentUserId={currentUserId}
            isDM={isDM}
            gmId={gmId}
          />
        </div>
      </div>

    </div>
  )
}