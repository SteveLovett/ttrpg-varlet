import type { FontOverrideDefinition, FontOverrideId } from './types'

const SYSTEM_SANS = "system-ui, 'Segoe UI', Roboto, sans-serif"
const SYSTEM_MONO = 'ui-monospace, Consolas, monospace'

export const FONT_OVERRIDES: Record<FontOverrideId, FontOverrideDefinition> = {
  theme: {
    id: 'theme',
    name: 'Theme default',
    googleFontsHref: null,
    sans: 'var(--theme-sans)',
    heading: 'var(--theme-heading)',
    mono: 'var(--theme-mono)',
  },
  system: {
    id: 'system',
    name: 'System',
    googleFontsHref: null,
    sans: SYSTEM_SANS,
    heading: SYSTEM_SANS,
    mono: SYSTEM_MONO,
  },
  inter: {
    id: 'inter',
    name: 'Inter',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    sans: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  literata: {
    id: 'literata',
    name: 'Literata',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&display=swap',
    sans: "'Literata', serif",
    heading: "'Literata', serif",
    mono: "'Courier Prime', monospace",
  },
  cinzel: {
    id: 'cinzel',
    name: 'Cinzel',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Outfit:wght@400;600&display=swap',
    sans: "'Outfit', sans-serif",
    heading: "'Cinzel', serif",
    mono: SYSTEM_MONO,
  },
  jetbrains: {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap',
    sans: "'JetBrains Mono', monospace",
    heading: "'JetBrains Mono', monospace",
    mono: "'JetBrains Mono', monospace",
    allMono: true,
  },
  'press-start': {
    id: 'press-start',
    name: 'Press Start 2P',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    sans: "'Press Start 2P', cursive",
    heading: "'Press Start 2P', cursive",
    mono: "'Press Start 2P', cursive",
    allMono: true,
  },
  'ibm-plex': {
    id: 'ibm-plex',
    name: 'IBM Plex Sans',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap',
    sans: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
}

export function fontOverrideById(id: FontOverrideId): FontOverrideDefinition {
  return FONT_OVERRIDES[id] ?? FONT_OVERRIDES.theme
}
