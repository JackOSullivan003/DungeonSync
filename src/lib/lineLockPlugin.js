import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const lineLockPluginKey = new PluginKey('lineLock')

// Walk doc children to find the top-level block index containing pos
function getBlockIndex(doc, pos) {
  let offset = 0
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i)
    const childStart = offset + 1
    const childEnd = offset + child.nodeSize
    if (pos >= childStart && pos <= childEnd) return i
    offset += child.nodeSize
  }
  return 0
}

// Resolve doc position for the start of a given block index
function blockIndexToPos(doc, index) {
  let offset = 0
  for (let i = 0; i < doc.childCount; i++) {
    if (i === index) return offset + 1
    offset += doc.child(i).nodeSize
  }
  return 1
}

// Find nearest unlocked block in a given direction
function findUnlockedNeighbour(lockMap, fromIndex, direction, docChildCount) {
  let i = fromIndex + direction
  while (i >= 0 && i < docChildCount) {
    if (!lockMap[i]) return i
    i += direction
  }
  return fromIndex
}

// Widget decoration rendering the username label at the top-left of a locked block
function buildLabelWidget(pos, username, color) {
  return Decoration.widget(pos, () => {
    const el = document.createElement('span')
    el.textContent = username
    el.style.cssText = [
      'position: absolute',
      'top: 2px',
      'left: 6px',
      'font-size: 0.65rem',
      'font-weight: 600',
      `color: ${color}`,
      'pointer-events: none',
      'user-select: none',
      'line-height: 1',
      'z-index: 10',
    ].join(';')
    return el
  }, { side: -1 })
}

// Build decorations from lock map { [blockIndex]: { username, color } }
function buildDecorations(doc, lockMap) {
  const decos = []
  let offset = 0
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i)
    const childEnd = offset + child.nodeSize
    const lock = lockMap[i]
    if (lock) {
      decos.push(
        Decoration.node(offset, childEnd, {
          style: [
            `background: ${lock.color}22`,
            `border-left: 2px solid ${lock.color}`,
            'padding-left: 6px',
            'border-radius: 2px',
            'box-sizing: border-box',
            'position: relative',
          ].join(';'),
        })
      )
      decos.push(buildLabelWidget(offset + 1, lock.username, lock.color))
    }
    offset += child.nodeSize
  }
  return DecorationSet.create(doc, decos)
}

export function createLineLockPlugin() {
  return new Plugin({
    key: lineLockPluginKey,

    state: {
      init() {
        return { lockMap: {}, decos: DecorationSet.empty }
      },
      apply(tr, pluginState, _oldState, newState) {
        const meta = tr.getMeta(lineLockPluginKey)
        if (meta?.lockMap !== undefined) {
          const decos = buildDecorations(newState.doc, meta.lockMap)
          return { lockMap: meta.lockMap, decos }
        }
        return {
          lockMap: pluginState.lockMap,
          decos: pluginState.decos.map(tr.mapping, newState.doc),
        }
      },
    },

    props: {
      decorations(state) {
        return this.getState(state).decos
      },

      filterTransaction(tr, state) {
        const { lockMap } = lineLockPluginKey.getState(state)
        if (!lockMap || Object.keys(lockMap).length === 0) return true
        if (!tr.docChanged && !tr.selectionSet) return true
        if (tr.steps.length === 0) return true
        const targetBlock = getBlockIndex(state.doc, tr.selection.$anchor.pos)
        if (lockMap[targetBlock]) return false
        return true
      },

      handleDOMEvents: {
        mousedown(view, event) {
          const { lockMap } = lineLockPluginKey.getState(view.state)
          if (!lockMap || Object.keys(lockMap).length === 0) return false
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!pos) return false
          const blockIndex = getBlockIndex(view.state.doc, pos.pos)
          if (lockMap[blockIndex]) {
            event.preventDefault()
            return true
          }
          return false
        },
      },

      handleKeyDown(view, event) {
        const { lockMap } = lineLockPluginKey.getState(view.state)
        if (!lockMap || Object.keys(lockMap).length === 0) return false

        const { doc, selection } = view.state
        const currentBlock = getBlockIndex(doc, selection.$anchor.pos)

        if (event.key === 'ArrowUp') {
          const above = currentBlock - 1
          if (above >= 0 && lockMap[above]) {
            const target = findUnlockedNeighbour(lockMap, above, -1, doc.childCount)
            const resolved = doc.resolve(blockIndexToPos(doc, target))
            view.dispatch(view.state.tr.setSelection(TextSelection.near(resolved)))
            return true
          }
        }

        if (event.key === 'ArrowDown') {
          const below = currentBlock + 1
          if (below < doc.childCount && lockMap[below]) {
            const target = findUnlockedNeighbour(lockMap, below, 1, doc.childCount)
            const resolved = doc.resolve(blockIndexToPos(doc, target))
            view.dispatch(view.state.tr.setSelection(TextSelection.near(resolved)))
            return true
          }
        }

        return false
      },
    },
  })
}