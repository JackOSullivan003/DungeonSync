'use client'

import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

let nextId = 1

function emptyEntry() {
  return {
    id: nextId++,
    name: '',
    initiative: '',
    hp: '',
    maxHp: '',
    ac: '',
    notes: '',
  }
}

function HPBar({ hp, maxHp }) {
  if (!maxHp || maxHp <= 0) return null
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const color = pct > 50 ? '#2ecc71' : pct > 25 ? '#f39c12' : '#e74c3c'
  return (
    <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.2s' }} />
    </div>
  )
}

export default function Initiative({ isDM }) {
  const [combatants, setCombatants] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState(emptyEntry())
  const [editingId, setEditingId] = useState(null)

  // ── Sorted list by initiative descending ─────────────────────────────────
  const sorted = [...combatants].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0))

  // ── Add combatant ─────────────────────────────────────────────────────────
  function addCombatant() {
    if (!newEntry.name.trim()) return
    setCombatants(prev => [...prev, {
      ...newEntry,
      hp: Number(newEntry.hp) || 0,
      maxHp: Number(newEntry.maxHp) || 0,
      ac: Number(newEntry.ac) || 0,
      initiative: Number(newEntry.initiative) || 0,
    }])
    setNewEntry(emptyEntry())
    setShowAddForm(false)
  }

  // ── Remove combatant ──────────────────────────────────────────────────────
  function removeCombatant(id) {
    setCombatants(prev => prev.filter(c => c.id !== id))
    setEditingId(null)
  }

  // ── Update field inline ───────────────────────────────────────────────────
  function updateField(id, field, value) {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  // ── Next turn ─────────────────────────────────────────────────────────────
  function nextTurn() {
    if (sorted.length === 0) return
    setActiveIndex(prev => (prev + 1) % sorted.length)
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    if (!confirm('Clear all combatants?')) return
    setCombatants([])
    setActiveIndex(0)
    setEditingId(null)
    setShowAddForm(false)
  }

  const activeCombatant = sorted[activeIndex % sorted.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ color: '#e0e0e0', fontWeight: 700, fontSize: '0.85rem' }}>
          ⚔️ Initiative
          {sorted.length > 0 && (
            <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: '0.78rem' }}>
              Round · {activeCombatant?.name}
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {isDM && sorted.length > 0 && (
            <>
              <button
                onClick={nextTurn}
                title="Next turn"
                style={{ background: '#c0392b', border: 'none', color: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', fontWeight: 600 }}
              >
                <NavigateNextIcon style={{ fontSize: 14 }} /> Next
              </button>
              <button
                onClick={reset}
                title="Reset tracker"
                style={{ background: 'none', border: '1px solid #3a3a3a', color: '#888', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
              >
                <RestartAltIcon style={{ fontSize: 14 }} />
              </button>
            </>
          )}
          {isDM && (
            <button
              onClick={() => setShowAddForm(v => !v)}
              title="Add combatant"
              style={{ background: 'none', border: '1px solid #3a3a3a', color: '#888', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
            >
              <AddIcon style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && isDM && (
        <div style={{ padding: '10px 12px', background: '#222', borderBottom: '1px solid #3a3a3a', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', gap: 6, marginBottom: 6 }}>
            <input
              placeholder="Name *"
              value={newEntry.name}
              onChange={e => setNewEntry(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addCombatant()}
              style={inputStyle}
            />
            <input
              placeholder="Init"
              type="number"
              value={newEntry.initiative}
              onChange={e => setNewEntry(p => ({ ...p, initiative: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="AC"
              type="number"
              value={newEntry.ac}
              onChange={e => setNewEntry(p => ({ ...p, ac: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="HP"
              type="number"
              value={newEntry.hp}
              onChange={e => setNewEntry(p => ({ ...p, hp: e.target.value, maxHp: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <input
            placeholder="Notes"
            value={newEntry.notes}
            onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))}
            style={{ ...inputStyle, width: '100%', marginBottom: 6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addCombatant} style={primaryBtnStyle}>Add</button>
            <button onClick={() => { setShowAddForm(false); setNewEntry(emptyEntry()) }} style={ghostBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Combatant list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 24, color: '#444', textAlign: 'center', fontSize: '0.85rem' }}>
            {isDM ? 'No combatants yet. Click + to add.' : 'Waiting for GM to set up combat…'}
          </div>
        ) : (
          sorted.map((c, i) => {
            const isActive = i === activeIndex % sorted.length
            const isEditing = editingId === c.id

            return (
              <div
                key={c.id}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #2a2a2a',
                  background: isActive ? 'rgba(192,57,43,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #c0392b' : '3px solid transparent',
                  cursor: isDM ? 'pointer' : 'default',
                }}
                onClick={() => isDM && setEditingId(isEditing ? null : c.id)}
              >
                {/* Row summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Initiative badge */}
                  <div style={{
                    minWidth: 32, height: 32, borderRadius: 6,
                    background: isActive ? '#c0392b' : '#2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                  }}>
                    {c.initiative || '—'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? '#fff' : '#ddd', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.72rem', display: 'flex', gap: 8 }}>
                      {c.ac > 0 && <span>AC {c.ac}</span>}
                      {c.maxHp > 0 && <span>HP {c.hp}/{c.maxHp}</span>}
                      {c.notes && <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes}</span>}
                    </div>
                    {c.maxHp > 0 && <HPBar hp={Number(c.hp)} maxHp={Number(c.maxHp)} />}
                  </div>

                  {isDM && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCombatant(c.id) }}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>

                {/* Inline edit fields — expanded when GM clicks row */}
                {isEditing && isDM && (
                  <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 6, marginBottom: 6 }}>
                      <input
                        value={c.name}
                        onChange={e => updateField(c.id, 'name', e.target.value)}
                        placeholder="Name"
                        style={inputStyle}
                      />
                      <input
                        value={c.initiative}
                        onChange={e => updateField(c.id, 'initiative', e.target.value)}
                        placeholder="Init"
                        type="number"
                        style={inputStyle}
                      />
                      <input
                        value={c.ac}
                        onChange={e => updateField(c.id, 'ac', e.target.value)}
                        placeholder="AC"
                        type="number"
                        style={inputStyle}
                      />
                      <input
                        value={c.hp}
                        onChange={e => updateField(c.id, 'hp', e.target.value)}
                        placeholder="HP"
                        type="number"
                        style={inputStyle}
                      />
                      <input
                        value={c.maxHp}
                        onChange={e => updateField(c.id, 'maxHp', e.target.value)}
                        placeholder="Max"
                        type="number"
                        style={inputStyle}
                      />
                    </div>
                    <input
                      value={c.notes}
                      onChange={e => updateField(c.id, 'notes', e.target.value)}
                      placeholder="Notes"
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  background: '#1e1e1e',
  border: '1px solid #3a3a3a',
  borderRadius: 4,
  color: '#e0e0e0',
  padding: '5px 7px',
  fontSize: '0.82rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const primaryBtnStyle = {
  background: '#c0392b',
  border: 'none',
  color: 'white',
  borderRadius: 4,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
}

const ghostBtnStyle = {
  background: 'none',
  border: '1px solid #3a3a3a',
  color: '#888',
  borderRadius: 4,
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: '0.82rem',
}