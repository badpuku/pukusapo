import type { AccountConfig } from '~/types'
import accountsData from '../../accounts.example.json'

export async function loadAccounts(): Promise<AccountConfig> {
  return accountsData as AccountConfig
}
