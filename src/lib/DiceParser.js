// Parses and rolls dice expressions like "2d6 + 1d4 + 3"
// Returns { result, breakdown } or null if not a valid dice expression

export function parseDiceExpression(input) {
  // Strip leading slash if present
  const expression = input.startsWith('/') ? input.slice(1).trim() : input.trim()

  // Match dice groups (XdY) and flat modifiers (+/- N)
  const diceRegex = /(\d+)d(\d+)/gi
  const modifierRegex = /([+-]\s*\d+)(?!d)/g

  const diceMatches = [...expression.matchAll(diceRegex)]
  if (diceMatches.length === 0) return null // not a dice expression

  const breakdown = []
  let total = 0

  // Roll each dice group
  for (const match of diceMatches) {
    const count = parseInt(match[1])
    const sides = parseInt(match[2])

    if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null // sanity limits

    const rolls = []
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }
    const groupTotal = rolls.reduce((a, b) => a + b, 0)
    total += groupTotal
    breakdown.push({ type: 'dice', expression: `${count}d${sides}`, rolls, total: groupTotal })
  }

  // Strip dice groups to find flat modifiers
  const withoutDice = expression.replace(diceRegex, '0')
  const modMatches = [...withoutDice.matchAll(modifierRegex)]

  for (const match of modMatches) {
    const value = parseInt(match[1].replace(/\s/g, ''))
    total += value
    breakdown.push({ type: 'modifier', value })
  }

  return { expression, result: total, breakdown }
}