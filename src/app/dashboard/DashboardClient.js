'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import CampaignCard from '@/components/CampaignCard'
import { TTRPG_ICONS } from '@/lib/campaignIcons'

import CloseIcon from '@mui/icons-material/Close'

// Preset card color palette — rgba values used as overlay on the card
const PALETTE = [
  { label: 'None',   value: null,                        color: 'transparent' },
  { label: 'Red',    value: 'rgba(220,50,50,0.6)',        color: '#dc3232' },
  { label: 'Green',  value: 'rgba(50,180,80,0.6)',        color: '#32b450' },
  { label: 'Blue',   value: 'rgba(50,100,220,0.6)',       color: '#3264dc' },
  { label: 'Purple', value: 'rgba(140,50,220,0.6)',       color: '#8c32dc' },
  { label: 'Orange', value: 'rgba(220,120,50,0.6)',       color: '#dc7832' },
  { label: 'Grey',   value: 'rgba(120,130,140,0.6)',      color: '#78828c' },
  { label: 'Gold',   value: 'rgba(220,180,50,0.6)',       color: '#dcb432' },
  { label: 'Teal',   value: 'rgba(50,180,180,0.6)',       color: '#32b4b4' },
]

// Shared icon + color + background image picker used in both create and edit modals
function CampaignCustomizationFields({ values, onChange, currentBgImage, onRemoveBgImage }) {
  return (
    <>
      <label>
        Icon
        <div className="icon-picker">
          {/* None option */}
          <button
            type="button"
            className={`icon-picker-btn ${!values.iconName ? 'selected' : ''}`}
            onClick={() => onChange({ ...values, iconName: null })}
            title="None"
          >
            —
          </button>
          {TTRPG_ICONS.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              type="button"
              title={label}
              className={`icon-picker-btn ${values.iconName === name ? 'selected' : ''}`}
              onClick={() => onChange({ ...values, iconName: name })}
            >
              <Icon fontSize="small" />
            </button>
          ))}
        </div>
      </label>

      <label>
        Card Color
        <div className="color-palette">
          {PALETTE.map(({ label, value, color }) => (
            <button
              key={label}
              type="button"
              title={label}
              className={`color-swatch ${values.cardColor === value ? 'selected' : ''}`}
              style={{ background: color === 'transparent' ? '#2a2a2a' : color }}
              onClick={() => onChange({ ...values, cardColor: value })}
            >
              {values.cardColor === value && <span className="swatch-check">✓</span>}
            </button>
          ))}
        </div>
      </label>

      <label>
        Background Image
        {/* Show existing background image preview if one exists and hasn't been flagged for removal */}
        {currentBgImage && !values.removeBackgroundImage && (
          <div className="current-bg-preview">
            <img src={currentBgImage.dataUrl} alt="Current background" className="current-bg-img" />
            <button
              type="button"
              className="remove-bg-btn"
              onClick={() => {
                onChange({ ...values, removeBackgroundImage: true, backgroundImageFile: null })
                onRemoveBgImage()
              }}
            >
              Remove Image
            </button>
          </div>
        )}

        {/* Only show upload input if no existing image or it was removed */}
        {(!currentBgImage || values.removeBackgroundImage) && (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={e => onChange({ ...values, backgroundImageFile: e.target.files?.[0] ?? null })}
              className="file-input"
            />
            {values.backgroundImageFile && (
              <small className="muted">{values.backgroundImageFile.name}</small>
            )}
          </>
        )}
      </label>
    </>
  )
}

export default function DashboardClient({ user }) {
  const router = useRouter()
  const userId = user.id

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeCampaign, setActiveCampaign] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  const [inviteCode, setInviteCode] = useState(null)
  const [inviteExpiry, setInviteExpiry] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const [imageUploading, setImageUploading] = useState(false)

  // Stores the currently loaded background image preview for the campaign being edited
  const [currentBgImage, setCurrentBgImage] = useState(null) // { id, dataUrl }

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    iconName: null,
    cardColor: null,
    backgroundImageFile: null,
  })

  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)

  useEffect(() => {
    if (user && (!user.username || user.username.trim() === '')) {
      setShowUsernameModal(true)
    }
  }, [user])

  async function loadCampaigns() {
    setLoading(true)
    const res = await fetch('/api/campaign')
    const data = await res.json()
    setCampaigns(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  // Opens the edit modal and fetches the existing background image preview if one exists
  async function openEditModal(campaign) {
    setActiveCampaign({ ...campaign, backgroundImageFile: null, removeBackgroundImage: false })
    setCurrentBgImage(null)

    if (campaign.backgroundImageId) {
      try {
        const res = await fetch(`/api/images/${campaign._id}/${campaign.backgroundImageId}`)
        if (res.ok) {
          const data = await res.json()
          setCurrentBgImage({
            id: campaign.backgroundImageId,
            dataUrl: `data:${data.mimeType};base64,${data.data}`,
          })
        }
      } catch (e) {
        console.error('Failed to load background image preview:', e)
      }
    }
  }

  // Converts a file to base64 and uploads it to the Images collection
  async function uploadBackgroundImage(file, campaignId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]
        const mimeType = file.type

        const res = await fetch(`/api/images/${campaignId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64, mimeType, type: 'campaign_background' }),
        })

        if (!res.ok) return reject('Upload failed')
        const data = await res.json()
        resolve(data._id)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function createCampaign() {
    if (!newCampaign.title.trim()) return alert('Title required')

    // Create campaign first so we have the campaignId for the image upload
    const res = await fetch('/api/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newCampaign.title,
        description: newCampaign.description,
        iconName: newCampaign.iconName,
        cardColor: newCampaign.cardColor,
      }),
    })

    if (!res.ok) return alert('Create failed')
    const created = await res.json()

    // Upload background image after campaign is created so we have the campaignId
    if (newCampaign.backgroundImageFile) {
      setImageUploading(true)
      try {
        const imageId = await uploadBackgroundImage(newCampaign.backgroundImageFile, created._id)
        await fetch(`/api/campaign/${created._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backgroundImageId: imageId }),
        })
        created.backgroundImageId = imageId
      } catch (e) {
        console.error('Background image upload failed:', e)
      }
      setImageUploading(false)
    }

    setCampaigns(prev => [created, ...prev])
    setShowCreateModal(false)
    setNewCampaign({ title: '', description: '', iconName: null, cardColor: null, backgroundImageFile: null })
  }

  async function saveCampaignChanges() {
    const updates = {
      title: activeCampaign.title,
      description: activeCampaign.description,
      iconName: activeCampaign.iconName ?? null,
      cardColor: activeCampaign.cardColor ?? null,
    }

    // Delete existing background image from DB if GM flagged it for removal
    if (activeCampaign.removeBackgroundImage && activeCampaign.backgroundImageId) {
      await fetch(`/api/images/${activeCampaign._id}/${activeCampaign.backgroundImageId}`, {
        method: 'DELETE',
      })
      updates.backgroundImageId = null
    }

    // Upload new background image if one was selected
    if (activeCampaign.backgroundImageFile) {
      setImageUploading(true)
      try {
        const imageId = await uploadBackgroundImage(activeCampaign.backgroundImageFile, activeCampaign._id)
        updates.backgroundImageId = imageId
      } catch (e) {
        console.error('Background image upload failed:', e)
      }
      setImageUploading(false)
    }

    const res = await fetch(`/api/campaign/${activeCampaign._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!res.ok) return alert('Save failed')

    setCampaigns(prev =>
      prev.map(c => c._id === activeCampaign._id ? { ...activeCampaign, ...updates } : c)
    )
    setActiveCampaign(null)
    setCurrentBgImage(null)
  }

  async function joinCampaign() {
    setJoinError('')
    const res = await fetch('/api/campaign/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode }),
    })

    const data = await res.json()
    if (!res.ok) return setJoinError(data.error || 'Failed to join')

    setCampaigns(prev => [...prev, data])
    setShowJoinModal(false)
    setJoinCode('')
  }

  async function getInviteCode(campaignId) {
    setInviteLoading(true)
    setInviteCode(null)
    setShowInviteModal(true)

    const res = await fetch(`/api/campaign/${campaignId}/invite`, { method: 'POST' })
    const data = await res.json()

    setInviteLoading(false)
    if (!res.ok) return setInviteCode('Error generating code')

    setInviteCode(data.inviteCode)
    setInviteExpiry(new Date(data.inviteCodeExpiry).toLocaleTimeString())
  }

  return (
    <div className="dashboard-page">
      <TopBar
        left={<button className='app-title-btn' onClick={() => router.push(`/`)}><h1 className="brand-title">DungeonSync</h1></button>}
        Title={<span>Dashboard</span>}
        right={<ProfileMenu user={user} />}
      />

      <div className="dashboard-content">
        {loading ? (
          <p>Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <h3>No campaigns yet</h3>
            <p>
              You're not part of any campaigns yet.
              <br />
              Create one or join by asking your GM for an invite code.
            </p>
            <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
              + Create Your First Campaign
            </button>
            <button className="primary-btn" onClick={() => setShowJoinModal(true)}>
              + Join Campaign
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-header">
              <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
                + New Campaign
              </button>
              <button className="primary-btn" onClick={() => setShowJoinModal(true)}>
                + Join Campaign
              </button>
            </div>

            <div className="campaign-grid">
              {campaigns.map(c => {
                const isGM = c.dmId?.toString() === userId
                return (
                  <CampaignCard
                    key={c._id}
                    campaign={c}
                    isGM={isGM}
                    userId={userId}
                    onOpen={() => router.push(`/campaign/${c._id}`)}
                    onEdit={() => openEditModal(c)}
                    onGetInviteCode={() => getInviteCode(c._id)}
                    onDelete={async () => {
                      if (!confirm('Delete this campaign?')) return
                      const res = await fetch(`/api/campaign/${c._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete' }),
                      })
                      if (res.ok) setCampaigns(prev => prev.filter(x => x._id !== c._id))
                    }}
                    onLeave={async () => {
                      if (!confirm('Leave this campaign?')) return
                      const res = await fetch(`/api/campaign/${c._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'leave' }),
                      })
                      if (res.ok) setCampaigns(prev => prev.filter(x => x._id !== c._id))
                    }}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal large">
            <div className="modal-header">
              <h3>Create Campaign</h3>
              <button onClick={() => setShowCreateModal(false)}><CloseIcon /></button>
            </div>

            <label>
              Title *
              <input
                value={newCampaign.title}
                onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
              />
            </label>

            <label>
              Description
              <textarea
                value={newCampaign.description}
                onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
              />
            </label>

            <CampaignCustomizationFields
              values={newCampaign}
              onChange={setNewCampaign}
              currentBgImage={null}
              onRemoveBgImage={() => {}}
            />

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={createCampaign} disabled={imageUploading}>
                {imageUploading ? 'Uploading…' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {activeCampaign && (
        <div className="modal-backdrop">
          <div className="modal large">
            <div className="modal-header">
              <h3>Edit Campaign</h3>
              <button onClick={() => { setActiveCampaign(null); setCurrentBgImage(null) }}><CloseIcon /></button>
            </div>

            <label>
              Title
              <input
                value={activeCampaign.title}
                onChange={e => setActiveCampaign({ ...activeCampaign, title: e.target.value })}
              />
            </label>

            <label>
              Description
              <textarea
                value={activeCampaign.description || ''}
                onChange={e => setActiveCampaign({ ...activeCampaign, description: e.target.value })}
              />
            </label>

            <CampaignCustomizationFields
              values={activeCampaign}
              onChange={setActiveCampaign}
              currentBgImage={currentBgImage}
              onRemoveBgImage={() => setCurrentBgImage(null)}
            />

            <div className="modal-actions">
              <button onClick={() => { setActiveCampaign(null); setCurrentBgImage(null) }}>Cancel</button>
              <button className="primary-btn" onClick={saveCampaignChanges} disabled={imageUploading}>
                {imageUploading ? 'Uploading…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoinModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Join Campaign</h3>
              <button onClick={() => { setShowJoinModal(false); setJoinCode(''); setJoinError('') }}>
                <CloseIcon />
              </button>
            </div>

            <label>
              Invite Code
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="e.g. A3F9B2C1"
                onKeyDown={e => e.key === 'Enter' && joinCampaign()}
              />
            </label>

            {joinError && <p className="error">{joinError}</p>}

            <div className="modal-actions">
              <button onClick={() => { setShowJoinModal(false); setJoinCode(''); setJoinError('') }}>
                Cancel
              </button>
              <button className="primary-btn" onClick={joinCampaign}>Join</button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE CODE MODAL */}
      {showInviteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Invite Players</h3>
              <button onClick={() => { setShowInviteModal(false); setCodeCopied(false) }}>
                <CloseIcon />
              </button>
            </div>

            {inviteLoading ? (
              <p>Generating code…</p>
            ) : (
              <>
                <p>Share this code with your players. It expires at <strong>{inviteExpiry}</strong>.</p>
                <div className="invite-code-display">{inviteCode}</div>
                <div className="modal-actions">
                  <button
                    className="primary-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode)
                      setCodeCopied(true)
                    }}
                  >
                    {codeCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* USERNAME MODAL */}
      {showUsernameModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Choose a username</h3>
            <p>This will be visible to other players.</p>

            <input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Username"
            />

            {error && <p className="error">{error}</p>}

            <button
              className="primary-btn"
              onClick={async () => {
                const res = await fetch('/api/user/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: newUsername }),
                })

                if (!res.ok) {
                  setError('Username already taken')
                  return
                }

                window.location.reload()
              }}
            >
              Save Username
            </button>
          </div>
        </div>
      )}
    </div>
  )
}