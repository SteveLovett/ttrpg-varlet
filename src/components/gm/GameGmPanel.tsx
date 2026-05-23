import { useEffect } from 'react'
import { useGameCharacters } from '../../hooks/useGameCharacters'
import { EncounterHelper } from './EncounterHelper'

type GameGmPanelProps = {
  gameId: string
  memberCount: number
  onAppendToSessionNotes: (block: string) => Promise<string | null>
}

export function GameGmPanel({ gameId, memberCount, onAppendToSessionNotes }: GameGmPanelProps) {
  const { characters, loadCharacters } = useGameCharacters(gameId)

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  const partySize = Math.max(1, characters.length > 0 ? characters.length : memberCount)
  const partyLevel =
    characters.length > 0
      ? Math.round(
          characters.reduce((sum, c) => sum + c.sheet_json.level, 0) / characters.length,
        )
      : 5

  return (
    <div className="game-gm-panel">
      <EncounterHelper
        defaultPartySize={partySize}
        defaultPartyLevel={partyLevel}
        onAppendToSessionNotes={onAppendToSessionNotes}
      />
    </div>
  )
}
