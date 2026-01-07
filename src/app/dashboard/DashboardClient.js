"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import TopBar from "@/components/TopBar"
import ProfileMenu from "@/components/ProfileMenu"

import MoreVertIcon from "@mui/icons-material/MoreVert"
import CloseIcon from "@mui/icons-material/Close"

export default function DashboardClient({ user }) {
  const router = useRouter()

  // AUTH SAFE USER DATA
  const userId = user.id // IMPORTANT: this is now a string, not ObjectId

  // STATE
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const [menuOpenId, setMenuOpenId] = useState(null)
  const [activeCampaign, setActiveCampaign] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    backgroundImage: "",
  })
  
  const [newUsername, setNewUsername] = useState("")
  const [error, setError] = useState("")

  const [showUsernameModal, setShowUsernameModal] = useState(false)
  
  
  useEffect(() => {
    if (user && (!user.username || user.username.trim() === "")) {
      setShowUsernameModal(true)
    }
  }, [user])


  // LOAD CAMPAIGNS
  async function loadCampaigns() {
    setLoading(true)
    const res = await fetch("/api/campaign")
    const data = await res.json()
    setCampaigns(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  // CREATE CAMPAIGN
  async function createCampaign() {
    if (!newCampaign.title.trim()) return alert("Title required")

    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      })

      if (!res.ok) throw new Error("Create failed")

      const created = await res.json()
      setCampaigns((prev) => [created, ...prev])

      setShowCreateModal(false)
      setNewCampaign({ title: "", description: "", backgroundImage: "" })
    } catch (err) {
      console.error(err)
      alert("Could not create campaign")
    }
  }

  // SAVE EDITS
  async function saveCampaignChanges() {
    try {
      const res = await fetch(`/api/campaign/${activeCampaign._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeCampaign.title,
          description: activeCampaign.description,
        }),
      })

      if (!res.ok) throw new Error("Save failed")

      setCampaigns((prev) =>
        prev.map((c) =>
          c._id === activeCampaign._id ? activeCampaign : c
        )
      )

      setActiveCampaign(null)
    } catch (err) {
      console.error(err)
      alert("Could not save changes")
    }
  }

  // RENDER
  return (
    <div className="dashboard-page">
      <TopBar Title={<span>Dashboard</span>} right={<ProfileMenu />} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <button
            className="primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + New Campaign
          </button>
        </div>

        {loading ? (
          <p>Loading campaigns…</p>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((c) => {
              const isDM = c.dmId === userId

              return (
                <div
                  key={c._id}
                  className="campaign-card"
                  style={{
                    backgroundImage: c.backgroundImage
                      ? `url(${c.backgroundImage})`
                      : undefined,
                  }}
                  onClick={() => router.push(`/campaign/${c._id}`)}
                >
                  <div className="campaign-card-overlay">
                    <div className="campaign-card-header">
                      <h3>{c.title}</h3>

                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(menuOpenId === c._id ? null : c._id)
                        }}
                      >
                        <MoreVertIcon />
                      </button>

                      {menuOpenId === c._id && (
                        <div className="campaign-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveCampaign(c)
                              setMenuOpenId(null)
                            }}
                          >
                            Settings
                          </button>

                          {isDM ? (
                            <button
                              className="danger"
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm("Delete this campaign?")) return

                                const res = await fetch(
                                  `/api/campaign/${c._id}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ action: "delete" }),
                                  }
                                )

                                if (res.ok) {
                                  setCampaigns((prev) =>
                                    prev.filter((x) => x._id !== c._id)
                                  )
                                } else {
                                  alert("Delete failed")
                                }
                              }}
                            >
                              Delete Campaign
                            </button>
                          ) : (
                            <button
                              className="danger"
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (
                                  !confirm(
                                    "Are you sure you want to leave this campaign?"
                                  )
                                )
                                  return

                                const res = await fetch(
                                  `/api/campaign/${c._id}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ action: "leave" }),
                                  }
                                )

                                if (res.ok) {
                                  setCampaigns((prev) =>
                                    prev.filter((x) => x._id !== c._id)
                                  )
                                } else {
                                  alert("Leave failed")
                                }
                              }}
                            >
                              Leave Campaign
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p>{c.description || "No description"}</p>
                  </div>
                </div>
              )
            })}
          </div>
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
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    title: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={newCampaign.description}
                onChange={(e) =>
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
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    backgroundImage: e.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={createCampaign}>
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {activeCampaign && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Campaign Settings</h3>
              <button onClick={() => setActiveCampaign(null)}>
                <CloseIcon />
              </button>
            </div>

            <label>
              Title
              <input
                value={activeCampaign.title}
                onChange={(e) =>
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
                value={activeCampaign.description || ""}
                onChange={(e) =>
                  setActiveCampaign({
                    ...activeCampaign,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button onClick={() => setActiveCampaign(null)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={saveCampaignChanges}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET USERNAME MODEL*/}
      {showUsernameModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Choose a username</h3>
            <p>This will be visible to other players.</p>

            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
            />

            {error && <p className="error">{error}</p>}

            <button
              className="primary-btn"
              onClick={async () => {
                const res = await fetch("/api/user/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: newUsername })
                })
              
                if (!res.ok) {
                  setError("Username already taken")
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
