import { describe, it, expect } from 'vitest'
import { loadAccounts } from '~/utils/config'
import type { AccountConfig } from '~/types'

describe('loadAccounts', () => {
  it('should load accounts from JSON file', async () => {
    const config: AccountConfig = await loadAccounts()

    expect(config.accounts).toBeDefined()
    expect(config.accounts.length).toBeGreaterThan(0)
    expect(config.accounts[0]).toHaveProperty('userId')
    expect(config.accounts[0]).toHaveProperty('password')
  })
})
