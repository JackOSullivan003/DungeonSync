'use client'

export default function TopBar({ left, Title, right }) {

  return (
    <header className="topbar">
      <div className="topbar-left">
        {left}
      </div>

      <div className="topbar-title">
        {Title}
      </div>

      <div className="topbar-right">
        {right}
      </div>
    </header>
  )
}