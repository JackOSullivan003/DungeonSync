"use client";

import { useEffect, useState } from "react";

export default function FileSidebar({ onSelect }) {
  const [notes, setNotes] = useState([]);

  async function loadNotes() {
    const res = await fetch("/api/campaign/files");
    const data = await res.json();
    console.log("notes API returned:", data);
    setNotes(data);
  }

  async function createNote() {
    const res = await fetch("/api/campaign/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });

    const newNote = await res.json();
    loadNotes();
    onSelect(newNote._id);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <div style={{ width: 250, padding: 10, background: "#111", color: "white", borderRight: "1px solid #333" }}>
      <button style={{ width: "100%", marginBottom: 10 }} onClick={createNote}>New Note</button>

      {notes.map((note) => (
        <div
          key={note._id}
          style={{
            padding: "6px 10px",
            borderRadius: 4,
            cursor: "pointer",
            marginBottom: 4,
            background: "#1a1a1a"
          }}
          onClick={() => onSelect(note._id)}
        >
          {note.title}
        </div>
      ))}
    </div>
  );
}
