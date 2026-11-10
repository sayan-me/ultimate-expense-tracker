import { describe, it, expect } from 'vitest'
import { escapeCsvField, parseCsv, toCsv } from './csv'

describe('escapeCsvField', () => {
  it('returns a plain field unquoted', () => {
    expect(escapeCsvField('Groceries')).toBe('Groceries')
  })

  it('returns an empty string unquoted', () => {
    expect(escapeCsvField('')).toBe('')
  })

  it('quotes a field containing a comma', () => {
    expect(escapeCsvField('Food, Dining')).toBe('"Food, Dining"')
  })

  it('quotes a field containing a double quote and doubles it', () => {
    expect(escapeCsvField('She said "hi"')).toBe('"She said ""hi"""')
  })

  it('quotes a field containing a newline', () => {
    expect(escapeCsvField('line one\nline two')).toBe('"line one\nline two"')
  })

  it('quotes a field containing a carriage return', () => {
    expect(escapeCsvField('line one\rline two')).toBe('"line one\rline two"')
  })

  it('quotes a field that is only whitespace, to preserve it exactly', () => {
    expect(escapeCsvField('  ')).toBe('"  "')
  })

  it('does not mangle unicode content', () => {
    expect(escapeCsvField('café ☕ 日本語')).toBe('café ☕ 日本語')
  })
})

describe('toCsv', () => {
  it('produces a header-only CSV for an empty row set', () => {
    expect(toCsv(['a', 'b'], [])).toBe('a,b\r\n')
  })

  it('joins fields with commas and rows with CRLF', () => {
    expect(
      toCsv(
        ['date', 'amount'],
        [
          ['2026-01-01', '12.50'],
          ['2026-01-02', '-3.00'],
        ]
      )
    ).toBe('date,amount\r\n2026-01-01,12.50\r\n2026-01-02,-3.00\r\n')
  })

  it('escapes fields that need it within a full document', () => {
    expect(toCsv(['description'], [['Coffee, tea & "snacks"']])).toBe(
      'description\r\n"Coffee, tea & ""snacks"""\r\n'
    )
  })
})

describe('parseCsv', () => {
  it('parses a simple header + rows document', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('handles bare LF line endings', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('strips a leading UTF-8 BOM (common from Excel exports)', () => {
    expect(parseCsv('﻿a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('unquotes a quoted field', () => {
    expect(parseCsv('a,b\n"hello",world')).toEqual([
      ['a', 'b'],
      ['hello', 'world'],
    ])
  })

  it('parses a quoted field containing a comma', () => {
    expect(parseCsv('a\n"one, two"')).toEqual([['a'], ['one, two']])
  })

  it('parses a quoted field containing an escaped double quote', () => {
    expect(parseCsv('a\n"she said ""hi"""')).toEqual([['a'], ['she said "hi"']])
  })

  it('parses a quoted field containing a newline', () => {
    expect(parseCsv('a\n"line one\nline two"')).toEqual([['a'], ['line one\nline two']])
  })

  it('skips fully blank lines (e.g. trailing newline at EOF)', () => {
    expect(parseCsv('a,b\n1,2\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('preserves an empty field between two commas', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ])
  })

  it('returns an empty array for an empty document', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('returns an empty array for a document that is only whitespace/newlines', () => {
    expect(parseCsv('\n\n\n')).toEqual([])
  })

  it('round-trips arbitrary content through toCsv and back', () => {
    const header = ['description', 'note']
    const rows = [
      ['Coffee, tea & "snacks"', 'line one\nline two'],
      ['', 'plain'],
      ['café ☕', ''],
    ]
    expect(parseCsv(toCsv(header, rows))).toEqual([header, ...rows])
  })
})
