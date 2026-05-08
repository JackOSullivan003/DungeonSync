'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAblyClient } from '@/lib/ably'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ avatar, avatarMimeType, username, size = 28, onClick }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    overflow: 'hidden',
  }

  if (avatar && avatarMimeType) {
    return (
      <div style={style} onClick={onClick} title={username}>
        <img
          src={`data:${avatarMimeType};base64,${avatar}`}
          alt={username}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return (
    <div style={style} onClick={onClick} title={username}>
      <AccountCircleIcon style={{ fontSize: size * 0.85, color: '#666' }} />
    </div>
  )
}

function RollMessage({ msg, onUsernameClick }) {
  const { rollData } = msg
  return (
    <div style={{
      background: 'rgba(192,57,43,0.12)',
      border: '1px solid rgba(192,57,43,0.3)',
      borderRadius: 6,
      padding: '8px 10px',
      marginBottom: 2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar
            avatar={msg.avatar}
            avatarMimeType={msg.avatarMimeType}
            username={msg.username}
            size={24}
            onClick={() => onUsernameClick(msg.username)}
          />
          <span
            onClick={() => onUsernameClick(msg.username)}
            style={{ color: '#c0392b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🎲 {msg.username}
          </span>
        </div>
        <span style={{ color: '#555', fontSize: '0.72rem' }}>{formatTime(msg.createdAt)}</span>
      </div>
      <div style={{ color: '#aaa', fontSize: '0.78rem', marginBottom: 4 }}>
        {rollData.expression}
      </div>
      <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: 6 }}>
        {rollData.breakdown.map((b, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: '#555' }}> + </span>}
            {b.type === 'dice'
              ? <span title={`${b.expression}: [${b.rolls.join(', ')}]`}>[{b.rolls.join(', ')}]</span>
              : <span>{b.value}</span>
            }
          </span>
        ))}
      </div>
      <div style={{ color: '#e74c3c', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>
        {rollData.result}
      </div>
    </div>
  )
}

function SystemMessage({ msg }) {
  return (
    <div style={{
      textAlign: 'center',
      color: '#555',
      fontSize: '0.75rem',
      fontStyle: 'italic',
      padding: '2px 0',
    }}>
      {msg.content}
    </div>
  )
}

function TextMessage({ msg, isOwn, isGM, onUsernameClick }) {
  return (
    <div style={{ marginBottom: 2, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Avatar
        avatar={msg.avatar}
        avatarMimeType={msg.avatarMimeType}
        username={msg.username}
        size={28}
        onClick={() => onUsernameClick(msg.username)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              onClick={() => onUsernameClick(msg.username)}
              style={{ color: isOwn ? '#e74c3c' : '#aaa', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {msg.username}
            </span>
            {isGM && (
              <span style={{
                background: 'rgba(192,57,43,0.2)',
                border: '1px solid #c0392b',
                color: '#e74c3c',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 3,
                letterSpacing: '0.05em',
              }}>
                GM
              </span>
            )}
          </div>
          <span style={{ color: '#444', fontSize: '0.72rem' }}>{formatTime(msg.createdAt)}</span>
        </div>
        <div style={{ color: '#ddd', fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

export default function Chat({ campaignId, userId, gmId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const router = useRouter()
  const isDiceRoll = input.trim().startsWith('/')

  function handleUsernameClick(username) {
    if (!username) return
    router.push(`/profile/${username}`)
  }

  // Initial fetch
  useEffect(() => {
    if (!campaignId) return

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/campaign/${campaignId}/chat`)
        if (!res.ok) return
        const data = await res.json()
        setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      } catch (err) {
        console.error('Chat fetch error:', err)
      }
    }

    fetchMessages()
  }, [campaignId])

  // Ably subscription
  useEffect(() => {
    if (!campaignId) return

    const ably = getAblyClient()
    const channel = ably.channels.get(`campaign:${campaignId}:chat`)

    channel.subscribe('message', (ablyMsg) => {
      const msg = ablyMsg.data
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [campaignId])

  // Send message
  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setError('')
    setSending(true)

    try {
      const res = await fetch(`/api/campaign/${campaignId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send')
        return
      }

      setInput('')
      // Ably subscription handles appending the new message
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setSending(false)
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
        padding: '8px 12px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a',
        fontSize: '0.82rem',
        color: '#888',
        flexShrink: 0,
      }}>
        Campaign Chat · type <span style={{ color: '#c0392b', fontFamily: 'monospace' }}>/1d6+3</span> to roll
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#444', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>
            No messages yet. Say hello!
          </div>
        )}

        {messages.map(msg => {
          if (msg.type === 'system') return <SystemMessage key={msg._id} msg={msg} />
          if (msg.type === 'roll') return (
            <RollMessage
              key={msg._id}
              msg={msg}
              onUsernameClick={handleUsernameClick}
            />
          )
          return (
            <TextMessage
              key={msg._id}
              msg={msg}
              isOwn={msg.userId?.toString() === userId}
              isGM={msg.userId?.toString() === gmId}
              onUsernameClick={handleUsernameClick}
            />
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '4px 12px', color: '#e74c3c', fontSize: '0.78rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 10px',
        borderTop: '1px solid #3a3a3a',
        background: '#222',
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={isDiceRoll ? 'e.g. /2d6 + 3' : 'Message…'}
          style={{
            flex: 1,
            background: '#1e1e1e',
            border: `1px solid ${isDiceRoll ? '#c0392b' : '#3a3a3a'}`,
            borderRadius: 6,
            color: '#e0e0e0',
            padding: '6px 10px',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          style={{
            background: isDiceRoll ? '#c0392b' : '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: 'white',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            opacity: (!input.trim() || sending) ? 0.5 : 1,
          }}
        >
          {isDiceRoll ? '🎲' : '↑'}
        </button>
      </div>
    </div>
  )
}