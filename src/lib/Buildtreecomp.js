export default function buildTree(folders = [], files = []) {

    const folderMap = {}
    const root = []

    if (!Array.isArray(folders)) folders = []
    if (!Array.isArray(files)) files = []

    folders.forEach(f => {
      folderMap[f._id] = { ...f, folders: [], files: [] }
    })

    files.forEach(file => {
      if (file.folderId && folderMap[file.folderId]) {
        folderMap[file.folderId].files.push(file)
      } else {
        root.push(file)
      }
    })

    folders.forEach(f => {
      if (f.parentId && folderMap[f.parentId]) {
        folderMap[f.parentId].folders.push(folderMap[f._id])
      } else {
        root.push(folderMap[f._id])
      }
    })

    return root
}
