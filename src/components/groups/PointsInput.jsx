export default function PointsInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min="0"
      max="9"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className="field-input text-center"
    />
  )
}
