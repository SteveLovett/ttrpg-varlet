import data from './character-options.json'

export const characterOptions = data as {
  species: string[]
  classes: { name: string; hitDie: number }[]
}
