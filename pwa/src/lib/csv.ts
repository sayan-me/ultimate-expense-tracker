/**
 * Minimal RFC 4180 CSV codec. No dependency — this app's CSV needs are
 * small and well-defined (export/import of transactions), and a
 * hand-rolled codec keeps that logic fully under test rather than
 * trusting a third-party parser's edge-case behavior.
 */

const NEEDS_QUOTING = /[",\r\n]/

export function escapeCsvField(value: string): string {
  if (value === '') return ''
  // Leading/trailing whitespace is quoted defensively too: some tools
  // (e.g. Excel) trim unquoted fields on their own read, which would
  // silently corrupt a value if this CSV gets opened and re-saved
  // before being re-imported.
  const needsQuoting = NEEDS_QUOTING.test(value) || value !== value.trim()
  if (!needsQuoting) {
    return value
  }
  return `"${value.replace(/"/g, '""')}"`
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsvField).join(','))
  return lines.join('\r\n') + '\r\n'
}

/**
 * Parses CSV text into rows of string fields. Strips a leading UTF-8
 * BOM, accepts CRLF or bare LF line endings, and drops fully blank
 * lines (e.g. a trailing newline at end of file).
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  let rowHasContent = false

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    if (rowHasContent || row.length > 1 || row[0] !== '') {
      rows.push(row)
    }
    row = []
    rowHasContent = false
  }

  while (i < input.length) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      rowHasContent = true
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      rowHasContent = true
      i++
      continue
    }
    if (char === ',') {
      endField()
      rowHasContent = true
      i++
      continue
    }
    if (char === '\r') {
      // Lookahead for \r\n; either way this ends the row.
      if (input[i + 1] === '\n') i++
      endRow()
      i++
      continue
    }
    if (char === '\n') {
      endRow()
      i++
      continue
    }

    field += char
    rowHasContent = true
    i++
  }

  // Final field/row, if the input didn't end with a newline.
  if (field !== '' || row.length > 0 || rowHasContent) {
    endRow()
  }

  return rows
}
