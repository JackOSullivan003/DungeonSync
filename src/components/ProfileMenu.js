'use client'

import { useState, useRef, useEffect } from 'react'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="profile-btn"
        onClick={() => setOpen(!open)}
      >
        <AccountCircleIcon fontSize="large" />
      </button>

      {open && (
        <div className="profile-dropdown">
          <button>Profile</button>
          <button>Settings</button>
          <div className="divider" />
          <button className="danger">Log out</button>
        </div>
      )}
    </div>
  )
}
