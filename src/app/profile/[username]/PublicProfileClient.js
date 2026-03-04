'use client'

import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import ProfileMenu from '@/components/ProfileMenu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function PublicProfileClient({ profile, currentUser }) {
  const router = useRouter()

  const joinedDate = new Date(profile.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="dashboard-page">
      <TopBar
        left={<button className="primary" onClick={() => router.push('/dashboard')}>← Dashboard</button>}
        Title={<span>{profile.username}'s Profile</span>}
        right={<ProfileMenu user={currentUser} />}
      />

      <div className="profile-page-content">
        <div className="profile-avatar-section">
          {/* TODO: replace with cloud-hosted avatar image when upload is implemented */}
          <AccountCircleIcon style={{ fontSize: 96 }} />
        </div>

        <div className="profile-form">
          <h2>{profile.name}</h2>
          <p className="muted">@{profile.username}</p>
          {profile.bio && <p>{profile.bio}</p>}
          <p className="muted">Joined {joinedDate}</p>
        </div>
      </div>
    </div>
  )
}