import { ThemeToggle } from './theme/ThemeToggle'
import { YEAR_MAX, YEAR_MIN, type Theme } from './state/types'

interface Props {
  year: number
  onChangeYear: (y: number) => void
  theme: Theme
  onToggleTheme: () => void
}

const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i)

export function Header({ year, onChangeYear, theme, onToggleTheme }: Props) {
  return (
    <header className="header">
      <div className="container header__inner">
        <h1 className="brand" data-testid="title">
          日付のミカタ
          <span className="brand__sub">祝日・連休・有休の使いどきが、ひと目で</span>
        </h1>
        <nav className="yearnav" aria-label="表示する年">
          <button type="button" className="btn btn--icon yearnav__arrow" onClick={() => onChangeYear(year - 1)} disabled={year <= YEAR_MIN} aria-label="前の年へ" data-testid="year-prev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <select className="yearnav__select" aria-label="年を選ぶ" value={year} onChange={(e) => onChangeYear(Number(e.currentTarget.value))} data-testid="year-select">
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--icon yearnav__arrow" onClick={() => onChangeYear(year + 1)} disabled={year >= YEAR_MAX} aria-label="次の年へ" data-testid="year-next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </nav>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
