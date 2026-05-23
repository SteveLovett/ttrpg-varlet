import { useState, type FormEvent } from 'react'
import { NumericInput } from '../NumericInput'

type SceneSetupFormProps = {
  onSubmit: (input: {
    name: string
    gridSizePx: number
    file: File
  }) => Promise<string | null>
  disabled?: boolean
}

export function SceneSetupForm({ onSubmit, disabled = false }: SceneSetupFormProps) {
  const [name, setName] = useState('Battle map')
  const [gridSize, setGridSize] = useState(50)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a map image to upload.')
      return
    }
    setBusy(true)
    setError(null)
    const err = await onSubmit({ name, gridSizePx: gridSize, file })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form className="vtt-setup-form" onSubmit={(e) => void handleSubmit(e)}>
      <h3>Set up battle map</h3>
      <p className="muted">
        Upload one map image for this game (PNG, JPEG, or WebP, up to 10 MB and
        4096×4096 pixels). Players will see it once you save.
      </p>
      <div className="form-row">
        <label htmlFor="vtt-scene-name">Scene name</label>
        <input
          id="vtt-scene-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || busy}
          maxLength={128}
          required
        />
      </div>
      <div className="form-row">
        <label htmlFor="vtt-grid-size">Grid size (px)</label>
        <NumericInput
          id="vtt-grid-size"
          min={8}
          max={512}
          emptyFallback={50}
          value={gridSize}
          onChange={setGridSize}
          disabled={disabled || busy}
        />
      </div>
      <div className="form-row">
        <label htmlFor="vtt-map-file">Map image</label>
        <input
          id="vtt-map-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled || busy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>
      <button type="submit" disabled={disabled || busy}>
        {busy ? 'Uploading…' : 'Create scene'}
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  )
}
