/**
 * Approximate day-of-month of the vernal / autumnal equinox (JST), using the
 * widely used polynomial approximations valid for 1900–2099. The official dates
 * are published in the government gazette in February of the preceding year;
 * these formulas have matched every published date so far.
 */
function trunc(x: number): number {
  return x < 0 ? Math.ceil(x) : Math.floor(x)
}

export function vernalEquinoxDay(year: number): number {
  if (year < 1900 || year > 2099) throw new RangeError(`equinox approximation not supported for ${year}`)
  if (year <= 1979) return trunc(20.8357 + 0.242194 * (year - 1980) - trunc((year - 1983) / 4))
  return trunc(20.8431 + 0.242194 * (year - 1980) - trunc((year - 1980) / 4))
}

export function autumnalEquinoxDay(year: number): number {
  if (year < 1900 || year > 2099) throw new RangeError(`equinox approximation not supported for ${year}`)
  if (year <= 1979) return trunc(23.2588 + 0.242194 * (year - 1980) - trunc((year - 1983) / 4))
  return trunc(23.2488 + 0.242194 * (year - 1980) - trunc((year - 1980) / 4))
}

/**
 * Whether the equinox dates of `year` are still provisional (not yet gazetted).
 * The Cabinet Office announces next year's dates in early February.
 */
export function isEquinoxProvisional(year: number, referenceISO: string): boolean {
  const refYear = Number(referenceISO.slice(0, 4))
  const refMonth = Number(referenceISO.slice(5, 7))
  if (year <= refYear) return false
  if (year === refYear + 1 && refMonth >= 2) return false
  return true
}
