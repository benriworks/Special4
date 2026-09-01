import { useId } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}

/** Radio-group styled as a segmented control (keyboard: arrow keys, as native radios). */
export function Segmented<T extends string>({ label, options, value, onChange, className }: Props<T>) {
  const name = useId()
  return (
    <div className={`segmented${className ? ` ${className}` : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value} className="segmented__option">
          <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  )
}
