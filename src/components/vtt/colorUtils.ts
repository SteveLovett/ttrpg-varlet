/** Normalize #RGB / #RRGGBB (optional leading #) to lowercase #rrggbb. */
export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  if (/^[0-9a-fA-F]{3}$/.test(body)) {
    body = body
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(body)) return null
  return `#${body.toLowerCase()}`
}

export function isValidHexColor(input: string): boolean {
  return normalizeHexColor(input) !== null
}

export function hexValidationMessage(input: string): string | null {
  if (!input.trim()) return 'Enter a hex color.'
  if (isValidHexColor(input)) return null
  return 'Invalid hex. Use #RRGGBB or #RGB (e.g. #ff5500 or #f50).'
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null
  const n = Number.parseInt(normalized.slice(1), 16)
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const rr = clamp(r).toString(16).padStart(2, '0')
  const gg = clamp(g).toString(16).padStart(2, '0')
  const bb = clamp(b).toString(16).padStart(2, '0')
  return `#${rr}${gg}${bb}`
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const hn = ((h % 360) + 360) % 360
  const sn = Math.max(0, Math.min(100, s)) / 100
  const ln = Math.max(0, Math.min(100, l)) / 100

  if (sn === 0) {
    const v = ln * 255
    return { r: v, g: v, b: v }
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hk = hn / 360

  const hue2rgb = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  return {
    r: hue2rgb(hk + 1 / 3) * 255,
    g: hue2rgb(hk) * 255,
    b: hue2rgb(hk - 1 / 3) * 255,
  }
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}
