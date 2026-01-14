"use client"

import { useRouter } from "next/navigation"
import TopBar from "@/components/TopBar"
import ProfileMenu from "@/components/ProfileMenu"
import "@/css/Home.css"


export default function HomeClient({ user }) {
  const router = useRouter()

  const goToDashboardOr = (fallback) => {
    router.push(user ? "/dashboard" : fallback)
  }


  return (
    <div className="home-page">
      <TopBar
        Title={<span className="brand-title">DungeonSync</span>}
        right={
          user ? (
            <div className="topbar-actions">
              <button 
                className="topbar-btn ghost"
                onClick={() => router.push("/dashboard")}  
              >
                Dashboard
              </button>
              <ProfileMenu user={user} />
            </div>
          ) : (
            <div className="topbar-actions">
              <button
                className="topbar-btn ghost"
                onClick={() => router.push("/login")}
              >
                Login
              </button>
              <button
                className="topbar-btn primary"
                onClick={() => router.push("/register")}
              >
                Get Started
              </button>
            </div>
          )
        }
      />

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>Run Better D&D Campaigns</h1>
          <p>
            DungeonSync keeps your campaigns, players, notes, and sessions
            organized — so you can focus on storytelling, not spreadsheets.
          </p>

          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={() => goToDashboardOr("/register")}
            >
              Create a Campaign
            </button>
            <button
              className="secondary-btn"
              onClick={() => goToDashboardOr("/login")}
            >
              Join Your Party
            </button>
          </div>
        </div>

        <div className="hero-image">
          {/* HERO IMAGE PLACEHOLDER */}
          <div className="image-placeholder large">
            Hero Image / App Preview
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Everything Your Table Needs</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="image-placeholder">Campaign Image</div>
            <h3>Campaign Management</h3>
            <p>
              Create campaigns, invite players, and manage everything from a
              single dashboard.
            </p>
          </div>

          <div className="feature-card">
            <div className="image-placeholder">Notes Image</div>
            <h3>Session Notes & Lore</h3>
            <p>
              Track NPCs, locations, secrets, and session notes without losing
              anything between games.
            </p>
          </div>

          <div className="feature-card">
            <div className="image-placeholder">Players Image</div>
            <h3>Player-Friendly</h3>
            <p>
              Players only see what they should — DMs stay in control.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <h2>How It Works</h2>

        <div className="steps">
          <div className="step">
            <span>1</span>
            <p>Create a campaign</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Invite your players</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>Run sessions with confidence</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Begin Your Adventure?</h2>
        <button
          className="primary-btn large"
          onClick={() => goToDashboardOr("/register")}
        >
           {user ? "Go to Dashboard" : "Start Your Campaign"}
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} DungeonSync</p>
      </footer>
    </div>
  )
}
