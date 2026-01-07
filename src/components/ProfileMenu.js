'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from "next/navigation"
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function ProfileMenu() {
  const router = useRouter()
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

  async function handleLogout() {
    try {
      await fetch("/api/user/logout", {
        method: "POST",
      })
    } finally {
      router.push("/")
      router.refresh() // important: clears server cache
    }
  }


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
          <button className="danger"
          onClick={handleLogout}>Log out</button>
        </div>
      )}
    </div>
  )
}
