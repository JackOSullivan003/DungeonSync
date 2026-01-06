'use client'

export default function TopBar({ left, title, right }) {

  return (
    <header className="topbar">
      <div className="topbar-left">
        {left}
      </div>

      <div className="topbar-title">
        {title}
      </div>

      <div className="topbar-right">
        {right}
      </div>
    </header>
  )
}