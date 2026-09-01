import type { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

/** '1月' … '12月' / '1日' … '31日' */
export function numberOptions(count: number, suffix: string): SelectOption[] {
  return Array.from({ length: count }, (_, i) => ({ value: String(i + 1), label: `${i + 1}${suffix}` }))
}
export const MONTH_OPTIONS = numberOptions(12, '月')
export const DAY_OPTIONS = numberOptions(31, '日')

function describedBy(id: string, hint?: string, error?: string | null): string | undefined {
  const ids: string[] = []
  if (hint) ids.push(`${id}-hint`)
  if (error) ids.push(`${id}-error`)
  return ids.length > 0 ? ids.join(' ') : undefined
}

interface ShellProps {
  id: string
  label: string
  hint?: string
  error?: string | null
  /** Control rendered to the right of the input (e.g. a 「今日」 button). */
  trailing?: ReactNode
  children: ReactNode
}

function FieldShell({ id, label, hint, error, trailing, children }: ShellProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {trailing ? (
        <div className="field__control">
          {children}
          {trailing}
        </div>
      ) : (
        children
      )}
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

interface BaseInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string | null
  testid?: string
}

interface DateFieldProps extends BaseInputProps {
  min?: string
  max?: string
  trailing?: ReactNode
}

export function DateField({ id, label, value, onChange, min, max, hint, error, trailing, testid }: DateFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} trailing={trailing}>
      <input
        id={id}
        className="input"
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        data-testid={testid}
      />
    </FieldShell>
  )
}

interface NumberFieldProps extends BaseInputProps {
  min?: number
  max?: number
}

export function NumberField({ id, label, value, onChange, min, max, hint, error, testid }: NumberFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        data-testid={testid}
      />
    </FieldShell>
  )
}

interface TextFieldProps extends BaseInputProps {
  maxLength?: number
}

export function TextField({ id, label, value, onChange, maxLength, hint, error, testid }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className="input"
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        data-testid={testid}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends BaseInputProps {
  options: SelectOption[]
}

export function SelectField({ id, label, value, onChange, options, hint, error, testid }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        data-testid={testid}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface MonthDayFieldsProps {
  idBase: string
  /** e.g. 開始 / 終了 — also used to build the selects' accessible names. */
  legend: string
  month: number
  day: number
  onChange: (month: number, day: number) => void
  error?: string | null
}

/** Month + day selects under one legend, for 'MM-DD' ranges (year is irrelevant). */
export function MonthDayFields({ idBase, legend, month, day, onChange, error }: MonthDayFieldsProps) {
  const errorId = `${idBase}-error`
  return (
    <fieldset className="field">
      <legend className="field__label">{legend}</legend>
      <div className="md-field__row">
        <select
          id={`${idBase}-month`}
          className="input"
          aria-label={`${legend}の月`}
          value={String(month)}
          onChange={(e) => onChange(Number(e.target.value), day)}
          aria-describedby={error ? errorId : undefined}
        >
          {MONTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="md-field__sep" aria-hidden="true">
          /
        </span>
        <select
          id={`${idBase}-day`}
          className="input"
          aria-label={`${legend}の日`}
          value={String(day)}
          onChange={(e) => onChange(month, Number(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          {DAY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
