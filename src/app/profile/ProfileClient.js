'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function ProfileClient({ user }) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? '')
  const [username, setUsername] = useState(user.username ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

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
          {/* TODO: replace with image upload to cloud service (e.g. Cloudinary) */}
          <AccountCircleIcon style={{ fontSize: 96 }} />
          <button className="primary-btn" disabled>Change Avatar</button>
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