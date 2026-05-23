import type { ThemeDefinition, ThemeId } from './types'

const SYSTEM_SANS = "system-ui, 'Segoe UI', Roboto, sans-serif"
const SYSTEM_MONO = 'ui-monospace, Consolas, monospace'

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Purple accent on a clean light background.',
    swatch: ['#aa3bff', '#fff', '#08060d'],
    googleFontsHref: null,
    bodySans: SYSTEM_SANS,
    heading: SYSTEM_SANS,
    mono: SYSTEM_MONO,
  },
  light: {
    id: 'light',
    name: 'Light',
    description: 'Neutral grays with crisp blue accents.',
    swatch: ['#2563eb', '#f9fafb', '#111827'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
    bodySans: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Neutral dark gray with soft violet accents.',
    swatch: ['#a78bfa', '#1f2937', '#f3f4f6'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
    bodySans: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue-black with cool cyan highlights.',
    swatch: ['#22d3ee', '#0f172a', '#e2e8f0'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
    bodySans: "'DM Sans', sans-serif",
    heading: "'DM Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  parchment: {
    id: 'parchment',
    name: 'Parchment',
    description: 'Warm paper tones and brown ink.',
    swatch: ['#92400e', '#f5f0e6', '#3d2c1e'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&family=EB+Garamond:wght@500;700&family=Courier+Prime:wght@400;700&display=swap',
    bodySans: "'Literata', serif",
    heading: "'EB Garamond', serif",
    mono: "'Courier Prime', monospace",
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane',
    description: 'Fantasy purple and teal with a subtle glow.',
    swatch: ['#a855f7', '#1a1028', '#5eead4'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&family=Cinzel:wght@500;700&family=Fira+Code:wght@400;600&display=swap',
    bodySans: "'Outfit', sans-serif",
    heading: "'Cinzel', serif",
    mono: "'Fira Code', monospace",
  },
  'cozy-hearth': {
    id: 'cozy-hearth',
    name: 'Cozy Hearth',
    description: 'Amber warmth by the fireside.',
    swatch: ['#f59e0b', '#2c1810', '#fde68a'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Lora:wght@500;700&family=IBM+Plex+Mono:wght@400;600&display=swap',
    bodySans: "'Nunito', sans-serif",
    heading: "'Lora', serif",
    mono: "'IBM Plex Mono', monospace",
  },
  'forest-court': {
    id: 'forest-court',
    name: 'Forest Court',
    description: 'Moss greens and natural earth tones.',
    swatch: ['#4ade80', '#1a2e1a', '#d9f99d'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Merriweather:wght@500;700&family=IBM+Plex+Mono:wght@400;600&display=swap',
    bodySans: "'Source Sans 3', sans-serif",
    heading: "'Merriweather', serif",
    mono: "'IBM Plex Mono', monospace",
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    description: 'Professional blue-gray workspace.',
    swatch: ['#38bdf8', '#1e293b', '#f1f5f9'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap',
    bodySans: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  'blood-moon': {
    id: 'blood-moon',
    name: 'Blood Moon',
    description: 'Dark crimson under a moonlit sky.',
    swatch: ['#ef4444', '#1c0a0a', '#fecaca'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&family=Playfair+Display:wght@500;700&family=Fira+Code:wght@400;600&display=swap',
    bodySans: "'Rubik', sans-serif",
    heading: "'Playfair Display', serif",
    mono: "'Fira Code', monospace",
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum readability with sharp borders.',
    swatch: ['#000', '#fff', '#000'],
    googleFontsHref: null,
    bodySans: SYSTEM_SANS,
    heading: SYSTEM_SANS,
    mono: SYSTEM_MONO,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Green phosphor on black.',
    swatch: ['#22c55e', '#0a0a0a', '#86efac'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap',
    bodySans: "'IBM Plex Mono', monospace",
    heading: "'IBM Plex Mono', monospace",
    mono: "'IBM Plex Mono', monospace",
  },
  'retro-8bit': {
    id: 'retro-8bit',
    name: 'Retro 8-bit',
    description: 'NES-style palette with pixel headings.',
    swatch: ['#fc0', '#0f380f', '#9bbc0f'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    bodySans: SYSTEM_SANS,
    heading: "'Press Start 2P', cursive",
    mono: SYSTEM_MONO,
    pixelHeadingsOnly: true,
  },
  'neon-arcade': {
    id: 'neon-arcade',
    name: 'Neon Arcade',
    description: 'Synthwave cyan and magenta glow.',
    swatch: ['#f0f', '#12001f', '#0ff'],
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Press+Start+2P&family=Share+Tech+Mono&display=swap',
    bodySans: "'Share Tech Mono', monospace",
    heading: "'Orbitron', sans-serif",
    mono: "'Share Tech Mono', monospace",
  },
}

export const THEME_LIST = Object.values(THEMES)

export function themeById(id: ThemeId): ThemeDefinition {
  return THEMES[id] ?? THEMES.default
}
