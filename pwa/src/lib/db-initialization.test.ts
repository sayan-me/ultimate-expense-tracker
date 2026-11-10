import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { initializeDefaultData } from './db-initialization'

describe('initializeDefaultData', () => {
  beforeEach(async () => {
    await db.accounts.clear()
    await db.categories.clear()
  })

  it('creates exactly one default Cash account', async () => {
    await initializeDefaultData()
    const accounts = await db.accounts.toArray()
    expect(accounts).toHaveLength(1)
    expect(accounts[0]).toMatchObject({ name: 'Cash', isDefault: true })
  })

  // Reported in live UAT: a fresh profile showed two identical "Cash
  // $0.00" accounts. Root cause: initializeDefaultAccount does a
  // count-then-add that isn't atomic, and this runs from a mount effect
  // that can fire more than once (React StrictMode in dev, or a remount
  // from DbIdentityGate) — two concurrent calls can both see count === 0
  // before either has written its row.
  it('creates only one Cash account even when initialization runs concurrently', async () => {
    await Promise.all([initializeDefaultData(), initializeDefaultData()])
    const accounts = await db.accounts.toArray()
    expect(accounts).toHaveLength(1)
  })

  it('does not duplicate default categories when initialization runs concurrently', async () => {
    await Promise.all([initializeDefaultData(), initializeDefaultData()])
    const categories = await db.categories.toArray()
    const names = categories.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
