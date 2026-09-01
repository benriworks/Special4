import { describe, expect, it } from 'vitest'
import { sanitizePrefs } from '../settingsStore'
import { buildHash, decodeRanges, encodeRanges, parseHash, sanitizeLabel } from '../urlState'

describe('url hash state', () => {
  it('round-trips labels containing separators and unicode', () => {
    const ranges = [
      { from: '12-29', to: '01-03', label: '年末,年始:休' },
      { from: '08-13', to: '08-16', label: 'お盆 🎐' },
    ]
    expect(decodeRanges(encodeRanges(ranges))).toEqual(ranges)
    const hash = buildHash({ year: 2026, pto: 3, mode: 'more3', settings: { weekend: 'sun', customRanges: ranges } })
    expect(parseHash(hash)).toEqual({ year: 2026, pto: 3, mode: 'more3', settings: { weekend: 'sun', customRanges: ranges } })
  })
  it('ignores invalid values and caps labels', () => {
    expect(parseHash('#y=1800&pto=99&mode=x&wk=zzz')).toEqual({})
    expect(parseHash('#wk=zzz&off=')).toEqual({ settings: { weekend: 'sat-sun', customRanges: [] } })
    expect(parseHash('#y=2026&pto=1e1')).toEqual({ year: 2026, pto: 10 })
    expect(decodeRanges('1301-0101:x,0229-0301:leap,abcd,0101-0102:%E3%81%82'.repeat(1))).toEqual([
      { from: '02-29', to: '03-01', label: 'leap' },
      { from: '01-01', to: '01-02', label: 'あ' },
    ])
    expect(sanitizeLabel('a'.repeat(30))).toBe('a'.repeat(12))
    expect(sanitizeLabel('\u0001 \n')).toBe('休業日')
    expect(sanitizeLabel(42)).toBe('休業日')
  })
})

describe('sanitizePrefs', () => {
  it('keeps only well-formed data', () => {
    expect(sanitizePrefs(null)).toEqual({})
    expect(sanitizePrefs({ pto: Infinity, mode: 'nope' })).toEqual({})
    expect(
      sanitizePrefs({
        pto: 3.7,
        mode: 'more3',
        settings: {
          weekend: 'sun',
          customRanges: [{ from: '12-29', to: '01-03', label: '年末年始' }, { from: '13-01', to: '01-01', label: 'bad' }, 'junk', { from: '08-13', to: '08-16', label: 7 }],
        },
      }),
    ).toEqual({
      pto: 3,
      mode: 'more3',
      settings: { weekend: 'sun', customRanges: [{ from: '12-29', to: '01-03', label: '年末年始' }, { from: '08-13', to: '08-16', label: '休業日' }] },
    })
  })
})
