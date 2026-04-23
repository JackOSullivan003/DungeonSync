'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { getAblyClient } from '@/lib/ably'

function Avatar({ avatar, avatarMimeType, username, size = 32 }) {
  const src = avatar && avatarMimeType ? `data:${avatarMimeType};base64,${avatar}` : null
  return src ? (
    <img
      src={src}
      alt={username}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <AccountCircleIcon style={{ fontSize: size, color: '#666', flexShrink: 0 }} />
  )
}

export default function PlayersMenu({ campaignId, currentUserId, isDM, gmId }) {
  const router = useRouter()
  const [members, setMembers] = useState([]) // [{ userId, username, avatar, avatarMimeType, isGM }]
  const [onlineIds, setOnlineIds] = useState(new Set())
  const [confirmRemove, setConfirmRemove] = useState(null) // { userId, username }
  const [removing, setRemoving] = useState(false)
  const channelRef = useRef(null)


useEffect(() => {
  if (!campaignId) return

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/campaign/${campaignId}/members`)
      if (!res.ok) return
      const data = await res.json()
      setMembers(data)
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }

  fetchMembers()
}, [campaignId])

// Ably presence for online indicators
useEffect(() => {
  if (!campaignId || !currentUserId) return

  const ably = getAblyClient()
  const channel = ably.channels.get(`campaign:${campaignId}:presence`)
  channelRef.current = channel

  function syncPresence() {
    channel.presence.get((err, presentMembers) => {
      if (err) return
      setOnlineIds(new Set(presentMembers.map(m => m.data?.userId).filter(Boolean)))
    })
  }

  channel.presence.subscribe((presenceMsg) => {
    const uid = presenceMsg.data?.userId
    if (!uid) return
    setOnlineIds(prev => {
      const next = new Set(prev)
      if (['enter', 'present', 'update'].includes(presenceMsg.action)) {
        next.add(uid)
      } else if (presenceMsg.action === 'leave') {
        next.delete(uid)
      }
      return next
    })
  })

  // Poll presence until we see at least the current user, then stop
  let attempts = 0
  const maxAttempts = 10
  const interval = setInterval(() => {
    channel.presence.get((err, presentMembers) => {
      if (err) return
      const ids = presentMembers.map(m => m.data?.userId).filter(Boolean)
      if (ids.length > 0 || attempts >= maxAttempts) {
        setOnlineIds(new Set(ids))
        clearInterval(interval)
      }
      attempts++
    })
  }, 400)

  return () => {
    clearInterval(interval)
    channel.presence.unsubscribe()
  }
}, [campaignId, currentUserId])


  // ── Remove player ─────────────────────────────────────────────────────────
  async function removePlayer(targetUserId, targetUsername) {
    setRemoving(true)
    try {
      const res = await fetch(`/api/campaign/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removePlayer', targetUserId, targetUsername }),
      })
      if (!res.ok) throw new Error('Remove failed')
      setMembers(prev => prev.filter(m => m.userId !== targetUserId))
      setConfirmRemove(null)
    } catch (err) {
      console.error('Failed to remove player:', err)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a',
        fontSize: '0.82rem',
        color: '#888',
        fontWeight: 600,
        flexShrink: 0,
      }}>
        Players · {members.length}
      </div>

      {/* Member list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {members.map(member => {
          const isOnline = onlineIds.has(member.userId)
          const isSelf = member.userId === currentUserId
          const canRemove = isDM && !member.isGM && !isSelf

          return (
            <div
              key={member.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 14px',
                cursor: 'pointer',
                borderRadius: 6,
                margin: '0 4px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar — clickable to profile */}
              <div
                onClick={() => router.push(`/profile/${member.username}`)}
                style={{ position: 'relative', flexShrink: 0 }}
              >
                <Avatar
                  avatar={member.avatar}
                  avatarMimeType={member.avatarMimeType}
                  username={member.username}
                  size={34}
                />
                {/* Online indicator dot */}
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: isOnline ? '#2ecc71' : 'transparent',
                  border: isOnline ? '1.5px solid #1e1e1e' : 'none',
                }} />
              </div>

              {/* Username + GM badge */}
              <div
                onClick={() => router.push(`/profile/${member.username}`)}
                style={{ flex: 1, minWidth: 0 }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  overflow: 'hidden',
                }}>
                  <span style={{
                    color: isSelf ? '#e74c3c' : '#ccc',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {member.username}
                  </span>
                  {member.isGM && (
                    <span style={{
                      background: 'rgba(192,57,43,0.2)',
                      border: '1px solid #c0392b',
                      color: '#e74c3c',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}>
                      GM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: isOnline ? '#2ecc71' : '#555', marginTop: 1 }}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* GM remove button */}
              {canRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmRemove({ userId: member.userId, username: member.username }) }}
                  style={{
                    background: 'none',
                    border: '1px solid #3a3a3a',
                    color: '#666',
                    borderRadius: 4,
                    padding: '2px 7px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#e74c3c' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#666' }}
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8,
            padding: '24px 28px', minWidth: 280, maxWidth: 360,
          }}>
            <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '1rem' }}>Remove Player</h3>
            <p style={{ color: '#aaa', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Are you sure you want to remove <strong style={{ color: '#fff' }}>{confirmRemove.username}</strong> from the campaign?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{
                  background: 'none', border: '1px solid #3a3a3a', color: '#aaa',
                  borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => removePlayer(confirmRemove.userId, confirmRemove.username)}
                disabled={removing}
                style={{
                  background: '#c0392b', border: 'none', color: '#fff',
                  borderRadius: 6, padding: '6px 16px', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, opacity: removing ? 0.6 : 1,
                }}
              >
                {removing ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}