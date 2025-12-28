'use client'

import ProfileMenu from './ProfileMenu'

export default function TopBar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        <ProfileMenu />
      </div>
    </header>
  )
}
