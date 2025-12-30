export default function buildTree(nodes) {
  const map = new Map()
  const roots = []

  nodes.forEach((node) => {
    map.set(node._id, { ...node, children: [] })
  })

  nodes.forEach((node) => {
    if (node.parentId) {
      map.get(node.parentId)?.children.push(map.get(node._id))
    } else {
      roots.push(map.get(node._id))
    }
  })

  return roots
}
