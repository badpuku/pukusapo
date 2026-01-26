import { describe, it, expect } from 'vitest'
import app from '~/index'

describe('POST /results', () => {
  
  it('should accept reservation results and return success', async () => {
    const res = await app.request('/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: 'user1',
        reservations: [
          {
            date: '2026-02-01',
            time: '10:00',
            status: 'success',
          },
        ],
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('success', true)
  })
})
