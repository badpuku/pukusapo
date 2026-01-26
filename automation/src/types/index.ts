export type Account = {
  userId: string
  password: string
}

export type Reservation = {
  date: string
  time: string
  facilityName: string
  status: 'success' | 'failed' | 'pending'
}

export type AccountConfig = {
  accounts: Account[]
}

export type ReservationResult = {
  accountId: string
  reservations: Reservation[]
}
