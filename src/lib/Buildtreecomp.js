export default function buildTree(nodes) {
  const map = new Map() // map of id → node with children
  const roots = [] // list of top-level nodes

  // Create node map
  nodes.forEach((node) => {
    map.set(node._id, { ...node, children: [] }) // copy node and add children array
  })

  // Build parent → children relationships
  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = map.get(node.parentId) // find parent node
      if (parent) {
        parent.children.push(map.get(node._id)) // add node as child
      }
    } else {
      roots.push(map.get(node._id)) // node has no parent, so it's a root
    }
  })

  // Recursive alphabetical sort
  function sortRecursive(list) {
    list.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) // sort by title
    )

    list.forEach((node) => {
      if (node.children.length > 0) {
        sortRecursive(node.children) // sort children too
      }
    })
  }

  sortRecursive(roots) // sort all root nodes

  return roots // return tree structure
}