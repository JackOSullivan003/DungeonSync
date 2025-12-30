'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadCampaigns() {
    setLoading(true)
    const res = await fetch('/api/campaign')
    const data = await res.json()
    setCampaigns(data)
    setLoading(false)
  }

  async function createCampaign() {
    const res = await fetch('/api/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Campaign' })
    })

    const campaign = await res.json()
    router.push(`/campaign/${campaign._id}`)
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <button onClick={createCampaign}>
        + New Campaign
      </button>

      <hr />

      {loading ? (
        <p>Loading campaigns…</p>
      ) : (
        <ul>
          {campaigns.map((c) => (
            <li key={c._id}>
              <button
                onClick={() => router.push(`/campaign/${c._id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#4ea1ff'
                }}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
