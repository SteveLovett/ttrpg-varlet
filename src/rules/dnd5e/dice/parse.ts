export type ParsedDieGroup = {
  count: number
  sides: number
  keep?: { mode: 'highest' | 'lowest'; count: number }
  drop?: { mode: 'highest' | 'lowest'; count: number }
}

export type ParsedFormula = {
  dice: ParsedDieGroup[]
  modifier: number
}

const DICE_CHUNK =
  /(\d*)d(\d+)(?:(kh|kl|dh|dl)(\d+))?/gi

/**
 * Parse dice notation: 2d6+1d4+3, 4d6dl1, 1d20kh1, 2d20kh1+5
 * Whitespace is ignored. Modifier terms use + and -.
 */
export function parseFormula(input: string): ParsedFormula | { error: string } {
  const raw = input.trim().toLowerCase()
  if (raw.length === 0) {
    return { error: 'Enter a dice formula.' }
  }
  if (!/^[\d\s+d+\-khld]+$/i.test(raw.replace(/\s/g, ''))) {
    return { error: 'Formula contains invalid characters.' }
  }

  const dice: ParsedDieGroup[] = []
  let modifier = 0

  const withoutDice = raw.replace(DICE_CHUNK, (match, countStr, sidesStr, modKind, modCountStr) => {
    const count = countStr === '' ? 1 : Number.parseInt(countStr, 10)
    const sides = Number.parseInt(sidesStr, 10)
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      return match
    }
    if (!Number.isFinite(sides) || sides < 2 || sides > 1000) {
      return match
    }

    const group: ParsedDieGroup = { count, sides }
    if (modKind && modCountStr) {
      const modCount = Number.parseInt(modCountStr, 10)
      if (!Number.isFinite(modCount) || modCount < 1) {
        return match
      }
      if (modKind === 'kh') {
        group.keep = { mode: 'highest', count: modCount }
      } else if (modKind === 'kl') {
        group.keep = { mode: 'lowest', count: modCount }
      } else if (modKind === 'dh') {
        group.drop = { mode: 'highest', count: modCount }
      } else if (modKind === 'dl') {
        group.drop = { mode: 'lowest', count: modCount }
      }
    }
    dice.push(group)
    return ' '
  })

  if (dice.length === 0) {
    return { error: 'Formula must include at least one die (e.g. 1d20).' }
  }

  const remainder = withoutDice.replace(/\s+/g, '')
  if (remainder.length > 0) {
    const modParts = remainder.match(/[+-]?\d+/g)
    if (!modParts) {
      return { error: 'Could not parse modifiers.' }
    }
    for (const part of modParts) {
      const n = Number.parseInt(part, 10)
      if (!Number.isFinite(n)) {
        return { error: 'Invalid modifier.' }
      }
      modifier += n
    }
  }

  return { dice, modifier }
}
