import { NumericInput } from '../NumericInput'

type AddToCharacterQuantityFieldProps = {
  id: string
  value: number
  disabled?: boolean
  onChange: (quantity: number) => void
}

export function AddToCharacterQuantityField({
  id,
  value,
  disabled,
  onChange,
}: AddToCharacterQuantityFieldProps) {
  return (
    <div className="form-row add-to-char-qty-row">
      <label htmlFor={id}>Quantity</label>
      <NumericInput
        id={id}
        min={1}
        max={999}
        emptyFallback={1}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
