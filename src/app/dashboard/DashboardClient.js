'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import CampaignCard from '@/components/CampaignCard'

import CloseIcon from '@mui/icons-material/Close'

export default function DashboardClient({ user }) {
  const router = useRouter()
  const userId = user.id

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeCampaign, setActiveCampaign] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    backgroundImage: '',
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

  async function createCampaign() {
    if (!newCampaign.title.trim()) return alert('Title required')

    const res = await fetch('/api/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign),
    })

    if (!res.ok) return alert('Create failed')

    const created = await res.json()
    setCampaigns(prev => [created, ...prev])
    setShowCreateModal(false)
    setNewCampaign({ title: '', description: '', backgroundImage: '' })
  }

  async function saveCampaignChanges() {
    const res = await fetch(`/api/campaign/${activeCampaign._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: activeCampaign.title,
        description: activeCampaign.description,
      }),
    })

    if (!res.ok) return alert('Save failed')

    setCampaigns(prev =>
      prev.map(c => (c._id === activeCampaign._id ? activeCampaign : c))
    )
    setActiveCampaign(null)
  }

  return (
    <div className="dashboard-page">
      <TopBar left= {<button className='app-title-btn' onClick={() => router.push(`/`)}><h1 className="brand-title">DungeonSync</h1></button>}Title={<span>Dashboard</span>} right={<ProfileMenu user={user}/>} />

      <div className="dashboard-content">
        {loading ? (
          <p>Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <h3>No campaigns yet</h3>
            <p>
              You’re not part of any campaigns yet.
              <br />
              Create one or join via an invite link.
            </p>

            <button
              className="primary-btn"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Your First Campaign
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-header">
              <button
                className="primary-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + New Campaign
              </button>
            </div>

            <div className="campaign-grid">
              {campaigns.map(c => {
                const isDM = c.dmId?.toString() === userId

                return (
                  <CampaignCard
                    key={c._id}
                    campaign={c}
                    isDM={isDM}
                    userId={userId}
                    onOpen={() => router.push(`/campaign/${c._id}`)}
                    onEdit={() => setActiveCampaign(c)}
                    onDelete={async () => {
                      if (!confirm('Delete this campaign?')) return
                      const res = await fetch(`/api/campaign/${c._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete' }),
                      })
                      if (res.ok) {
                        setCampaigns(prev =>
                          prev.filter(x => x._id !== c._id)
                        )
                      }
                    }}
                    onLeave={async () => {
                      if (!confirm('Leave this campaign?')) return
                      const res = await fetch(`/api/campaign/${c._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'leave' }),
                      })
                      if (res.ok) {
                        setCampaigns(prev =>
                          prev.filter(x => x._id !== c._id)
                        )
                      }
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
              <button onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <label>
              Title *
              <input
                value={newCampaign.title}
                onChange={e =>
                  setNewCampaign({ ...newCampaign, title: e.target.value })
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={newCampaign.description}
                onChange={e =>
                  setNewCampaign({
                    ...newCampaign,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Background Image URL
              <input
                value={newCampaign.backgroundImage}
                onChange={e =>
                  setNewCampaign({
                    ...newCampaign,
                    backgroundImage: e.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={createCampaign}>
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {activeCampaign && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Campaign</h3>
              <button onClick={() => setActiveCampaign(null)}>
                <CloseIcon />
              </button>
            </div>

            <label>
              Title
              <input
                value={activeCampaign.title}
                onChange={e =>
                  setActiveCampaign({
                    ...activeCampaign,
                    title: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={activeCampaign.description || ''}
                onChange={e =>
                  setActiveCampaign({
                    ...activeCampaign,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button onClick={() => setActiveCampaign(null)}>Cancel</button>
              <button className="primary-btn" onClick={saveCampaignChanges}>
                Save
              </button>
            </div>
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
