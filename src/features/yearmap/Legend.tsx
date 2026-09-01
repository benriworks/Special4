export function Legend() {
  return (
    <ul className="legend" aria-label="凡例">
      <li className="legend__item">
        <span className="legend__chip legend__chip--holiday" aria-hidden="true">
          1
        </span>
        祝日・振替休日・国民の休日
      </li>
      <li className="legend__item">
        <span className="legend__chip legend__chip--ribbon" aria-hidden="true" />
        3日以上の連休
      </li>
      <li className="legend__item">
        <span className="legend__chip legend__chip--pto" aria-hidden="true" />
        有休（提案）
      </li>
      <li className="legend__item">
        <span className="legend__chip legend__chip--custom" aria-hidden="true">
          1
        </span>
        休業日
      </li>
      <li className="legend__item">
        <span className="legend__chip legend__chip--today" aria-hidden="true" />
        今日
      </li>
    </ul>
  )
}
