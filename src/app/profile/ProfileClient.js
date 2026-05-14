'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import EditIcon from '@mui/icons-material/Edit'

export default function ProfileClient({ user }) {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user.name ?? '')
  const [username, setUsername] = useState(user.username ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const [avatar, setAvatar] = useState(user.avatar ?? null)
  const [avatarMimeType, setAvatarMimeType] = useState(user.avatarMimeType ?? null)
  const [uploading, setUploading] = useState(false)

  async function saveProfile() {
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, bio }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) return setError(data.error || 'Save failed')
    setSuccess(true)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: base64, avatarMimeType: file.type }),
      })

      if (!res.ok) throw new Error('Upload failed')

      setAvatar(base64)
      setAvatarMimeType(file.type)
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const avatarSrc = avatar && avatarMimeType
    ? `data:${avatarMimeType};base64,${avatar}`
    : null

  const joinedDate = new Date(user.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="dashboard-page">
      <TopBar
        left={<button className="primary" onClick={() => router.push('/dashboard')}>← Dashboard</button>}
        Title={<span>Profile</span>}
        right={<ProfileMenu user={user} />}
      />

      <div className="profile-page-content">
        <div className="profile-avatar-section">

          {/* Avatar with edit overlay */}
          <div
            style={{ position: 'relative', width: 160, height: 160, display: 'inline-block' }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Your avatar"
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <AccountCircleIcon style={{ fontSize: 160 }} />
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#1976d2',
                border: '2px solid #1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'wait' : 'pointer',
                padding: 0,
              }}
              title="Upload profile picture"
            >
              <EditIcon style={{ fontSize: 18, color: '#fff' }} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          {uploading && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 6 }}>Uploading…</p>
          )}
        </div>

        <div className="profile-form">
          <label>
            Name
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>

          <label>
            Username
            <input value={username} onChange={e => setUsername(e.target.value)} />
          </label>

          <label>
            Email <span className="muted">(cannot be changed)</span>
            <input value={user.email} disabled />
          </label>

          <label>
            Bio
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} />
          </label>

          <p className="muted">Joined {joinedDate}</p>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">Profile saved!</p>}

          <button className="primary-btn" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}