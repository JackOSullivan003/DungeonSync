export default function buildTree(nodes) {
  const map = new Map()
  const roots = []

  // Create node map
  nodes.forEach((node) => {
    map.set(node._id, { ...node, children: [] })
  })

  // Build parent → children relationships
  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = map.get(node.parentId)
      if (parent) {
        parent.children.push(map.get(node._id))
      }
    } else {
      roots.push(map.get(node._id))
    }
  })

  // Recursive alphabetical sort
  function sortRecursive(list) {
    list.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )

    list.forEach((node) => {
      if (node.children.length > 0) {
        sortRecursive(node.children)
      }
    })
  }

  sortRecursive(roots)

  return roots
}
