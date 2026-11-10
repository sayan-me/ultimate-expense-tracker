import { describe, it, expect } from 'vitest'
import { transactionsToCsv, parseTransactionsCsv, CSV_HEADER } from './csv-transactions'
import type { Transaction, Account } from './db'

const accounts: Account[] = [
  { id: 1, name: 'Cash', type: 'cash', openingBalance: 100, isDefault: true, createdAt: new Date() },
  { id: 2, name: 'Bank Account', type: 'bank', openingBalance: 2500, createdAt: new Date() },
]

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 1,
    amount: 4250, // $42.50 in cents — the CSV text itself stays in dollars (see transactionsToCsv)
    type: 'expense',
    category: 'Food & Dining',
    description: 'Lunch',
    date: new Date('2026-01-15T12:30:00.000Z'),
    accountId: 1,
    tags: ['Essential'],
    createdAt: new Date('2026-01-15T12:30:00.000Z'),
    updatedAt: new Date('2026-01-15T12:30:00.000Z'),
    ...overrides,
  }
}

describe('transactionsToCsv', () => {
  it('produces a header-only CSV when there are no transactions', () => {
    expect(transactionsToCsv([], accounts)).toBe(CSV_HEADER.join(',') + '\r\n')
  })

  it('writes one row per transaction with the expected columns', () => {
    const csv = transactionsToCsv([tx({})], accounts)
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe('date,type,category,description,amount,account,tags')
    expect(lines[1]).toBe('2026-01-15T12:30:00.000Z,expense,Food & Dining,Lunch,42.50,Cash,Essential')
  })

  it('joins multiple tags with semicolons', () => {
    const csv = transactionsToCsv([tx({ tags: ['Essential', 'Recurring'] })], accounts)
    expect(csv).toContain('Essential;Recurring')
  })

  it('leaves the tags field empty when there are no tags', () => {
    const csv = transactionsToCsv([tx({ tags: [] })], accounts)
    const lines = csv.trim().split('\r\n')
    expect(lines[1].endsWith(',')).toBe(true)
  })

  it('resolves the account name from accountId', () => {
    const csv = transactionsToCsv([tx({ accountId: 2 })], accounts)
    expect(csv).toContain(',Bank Account,')
  })

  it('leaves the account field empty for an orphaned accountId instead of crashing', () => {
    // e.g. the account was deleted after the transaction was created.
    const csv = transactionsToCsv([tx({ accountId: 999 })], accounts)
    const lines = csv.trim().split('\r\n')
    const fields = lines[1].split(',')
    expect(fields[5]).toBe('')
  })

  it('CSV-escapes a description containing a comma and quotes', () => {
    const csv = transactionsToCsv([tx({ description: 'Coffee, "the usual"' })], accounts)
    expect(csv).toContain('"Coffee, ""the usual"""')
  })

  it('writes multiple transactions in the given order', () => {
    const csv = transactionsToCsv(
      [tx({ id: 1, description: 'First' }), tx({ id: 2, description: 'Second' })],
      accounts
    )
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('First')
    expect(lines[2]).toContain('Second')
  })
})

describe('parseTransactionsCsv', () => {
  it('round-trips a full export back into equivalent transaction data', () => {
    const original = tx({ tags: ['Essential', 'Recurring'] })
    const csv = transactionsToCsv([original], accounts)

    const { rows, errors } = parseTransactionsCsv(csv, accounts)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(rows[0].data).toEqual({
      amount: 4250,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Lunch',
      date: new Date('2026-01-15T12:30:00.000Z'),
      accountId: 1,
      tags: ['Essential', 'Recurring'],
    })
  })

  it('reports an empty file as a single top-level error', () => {
    const { rows, errors } = parseTransactionsCsv('', accounts)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/empty/i)
  })

  it('reports a wrong/missing header as a single top-level error', () => {
    const { rows, errors } = parseTransactionsCsv('foo,bar\n1,2', accounts)
    expect(rows).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/header/i)
  })

  it('accepts a header-only file as zero rows, zero errors', () => {
    const { rows, errors } = parseTransactionsCsv(CSV_HEADER.join(',') + '\r\n', accounts)
    expect(rows).toEqual([])
    expect(errors).toEqual([])
  })

  it('skips a row with the wrong number of columns but keeps parsing the rest', () => {
    const csv =
      CSV_HEADER.join(',') +
      '\r\n' +
      '2026-01-15T12:30:00.000Z,expense,Food,Lunch,10.00\r\n' + // too few columns
      '2026-01-15T12:30:00.000Z,expense,Food,Lunch,10.00,Cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].rowNumber).toBe(2)
    expect(errors[0].message).toMatch(/column/i)
    expect(rows).toHaveLength(1)
    expect(rows[0].rowNumber).toBe(3)
  })

  it('rejects an invalid date', () => {
    const csv = CSV_HEADER.join(',') + '\r\nnot-a-date,expense,Food,Lunch,10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/date/i)
  })

  it('rejects a type that is not expense or income', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,transfer,Food,Lunch,10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/type/i)
  })

  it('accepts type case-insensitively', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,EXPENSE,Food,Lunch,10.00,Cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows[0].data.type).toBe('expense')
  })

  it('rejects a non-numeric amount', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,abc,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/amount/i)
  })

  it('rejects a negative amount', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,-10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('rejects a zero amount', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,0,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('rejects an amount over the 1,000,000 cap', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,1000001,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('rejects an empty category', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,,Lunch,10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/category/i)
  })

  it('rejects a category over 50 characters', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,' + 'x'.repeat(51) + ',Lunch,10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('rejects a description over 200 characters', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,' + 'x'.repeat(201) + ',10.00,Cash,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('converts the CSV dollar amount into integer cents for the returned transaction data', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.50,Cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows[0].data.amount).toBe(1050)
  })

  it('accepts an empty description (optional field)', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,,10.00,Cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows[0].data.description).toBe('')
  })

  it('rejects an unknown account name, naming it in the error', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.00,Nonexistent,\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Nonexistent')
  })

  it('matches an account name case-insensitively', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.00,cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows[0].data.accountId).toBe(1)
  })

  it('splits tags on semicolons, trims them, and drops empty entries', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.00,Cash,"Food;; Dining ;"\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows[0].data.tags).toEqual(['Food', 'Dining'])
  })

  it('rejects a tag over 30 characters', () => {
    const csv = CSV_HEADER.join(',') + '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.00,Cash,' + 'x'.repeat(31) + '\r\n'
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
  })

  it('rejects a future-dated row, consistent with the add-expense form', () => {
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 1)
    const csv = CSV_HEADER.join(',') + `\r\n${farFuture.toISOString()},expense,Food,Lunch,10.00,Cash,\r\n`
    const { errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/future/i)
  })

  it('partitions multiple rows into valid rows and errors independently, preserving row numbers', () => {
    const csv =
      CSV_HEADER.join(',') +
      '\r\n' +
      '2026-01-15T12:00:00.000Z,expense,Food,Good row,10.00,Cash,\r\n' + // row 2: valid
      '2026-01-15T12:00:00.000Z,expense,Food,Bad amount,abc,Cash,\r\n' + // row 3: invalid
      '2026-01-16T12:00:00.000Z,income,Salary,Another good row,500.00,Bank Account,\r\n' // row 4: valid

    const { rows, errors } = parseTransactionsCsv(csv, accounts)

    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.rowNumber)).toEqual([2, 4])
    expect(errors).toHaveLength(1)
    expect(errors[0].rowNumber).toBe(3)
  })

  it('handles a CRLF file with a BOM, matching a real spreadsheet export', () => {
    const csv =
      '﻿' +
      CSV_HEADER.join(',') +
      '\r\n2026-01-15T12:00:00.000Z,expense,Food,Lunch,10.00,Cash,\r\n'
    const { rows, errors } = parseTransactionsCsv(csv, accounts)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
  })
})
