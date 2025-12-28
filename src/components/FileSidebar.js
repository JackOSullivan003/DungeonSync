'use client'

import { useEffect, useState } from "react";
import FolderNode from "./FolderNode";
import FileNode from "./FileNode";
import buildTree from "@/lib/Buildtreecomp";
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CreateNewFileIcon from '@mui/icons-material/NoteAdd';

export default function FileSidebar({ onSelect, currentNoteId }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  async function loadData() {
    const [filesRes, foldersRes] = await Promise.all([
      fetch("/api/campaign/files"),
      fetch("/api/campaign/folders")
    ]);

    const filesData = await filesRes.json();
    const foldersData = await foldersRes.json();

    setFiles(filesData);
    setFolders(foldersData);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function onCreateFile(folderId = null) {
    const res = await fetch("/api/campaign/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", folderId })
    });
    const newFile = await res.json();
    await loadData();
    onSelect(newFile._id);
  }

  async function onCreateFolder(parentId = null) {
    await fetch("/api/campaign/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Folder", parentId })
    });
    await loadData();
  }

  async function onDeleteFile(id) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/campaign/files/${id}`, { method: "DELETE" });
    await loadData();
    if (currentNoteId === id) onSelect(null);
  }

  async function onDeleteFolder(id) {
    if (!confirm("Delete this folder?")) return;
    await fetch(`/api/campaign/folders/${id}`, { method: "DELETE" });
    await loadData();
  }

  async function onRenameFolder(id, title) {
    await fetch(`/api/campaign/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    await loadData();
  }

  const tree = buildTree(folders, files);

  return (

    <div className="file-sidebar">
      
      <h1>Files</h1>
      
      <button onClick={() => onCreateFile(null)}><CreateNewFileIcon className="button-icon"/></button>
      <button onClick={() => onCreateFolder(null)}><CreateNewFolderIcon className="button-icon"/></button>
      <hr></hr>
      <div className="file-hierarchy-container">
      {tree.map(node =>
        node.files || node.folders
          ? <FolderNode
              key={node._id}
              node={node}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
              onSelect={onSelect}
              currentNoteId={currentNoteId}
              onDeleteFile={onDeleteFile}
            />
          : <FileNode
              key={node._id}
              file={node}
              onSelect={onSelect}
              currentNoteId={currentNoteId}
              onDeleteFile={onDeleteFile}
            />
      )}
      </div>
    </div>
  )
}
