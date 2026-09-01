import { Fragment } from 'react'
import { useCopy } from '../../ui/useCopy'

export interface ResultItem {
  term: string
  value: string
}

interface Props {
  /** Caption above the value, e.g. 「10営業日後」. */
  label: string
  /** Main value, H2-size tabular. */
  value: string
  /** Extra caption lines under the value (nullish entries are skipped). */
  lines?: (string | null | undefined)[]
  /** Term / value pairs rendered as a definition list (nullish entries are skipped). */
  items?: (ResultItem | null | undefined)[]
  /** Footnote caption at the bottom of the card. */
  caption?: string
  /** When set, a 「コピー」 button copies this text. */
  copyText?: string
  testid?: string
}

/** DESIGN_SPEC §9 ResultCard: surface, 1px border, caption label, H2 value, copy button top-right. */
export function ResultCard({ label, value, lines, items, caption, copyText, testid }: Props) {
  const copy = useCopy()
  const shownLines = (lines ?? []).filter((l): l is string => typeof l === 'string' && l.length > 0)
  const shownItems = (items ?? []).filter((i): i is ResultItem => i != null)
  return (
    <div className="card result-card" data-testid={testid}>
      <div className="result-card__head">
        <span className="caption">{label}</span>
        {copyText && (
          <button
            type="button"
            className="btn btn--secondary"
            aria-label={`${label}の結果をコピー`}
            onClick={() => {
              void copy(copyText)
            }}
          >
            コピー
          </button>
        )}
      </div>
      <div className="result-card__body">
        <p className="result-card__value">{value}</p>
        {shownLines.map((l, i) => (
          <p key={i} className="caption">
            {l}
          </p>
        ))}
        {shownItems.length > 0 && (
          <dl className="result-card__list">
            {shownItems.map((it) => (
              <Fragment key={it.term}>
                <dt>{it.term}</dt>
                <dd>{it.value}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
      {caption && <p className="caption">{caption}</p>}
    </div>
  )
}
