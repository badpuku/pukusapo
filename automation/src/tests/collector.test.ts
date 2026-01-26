import { describe, it, expect } from 'vitest'
import { fetchReservations } from '~/collector'
import type { Account } from '~/types'

describe('fetchReservations', () => {
  it('should fetch reservations for a single account', async () => {
    const account: Account = {
      userId: 'test_user',
      password: 'test_password',
    }

    const reservations = await fetchReservations(account)

    expect(reservations).toBeDefined()
    expect(Array.isArray(reservations)).toBe(true)
  })

  it('should return reservation with required fields', async () => {
    const account: Account = {
      userId: 'test_user',
      password: 'test_password',
    }

    const reservations = await fetchReservations(account)

    if (reservations.length > 0) {
      expect(reservations[0]).toHaveProperty('date')
      expect(reservations[0]).toHaveProperty('time')
      expect(reservations[0]).toHaveProperty('facilityName')
      expect(reservations[0]).toHaveProperty('status')
    }
  })
})
