export type Account = {
  userId: string
  password: string
}

export const RESERVATION_STATUS = {
  confirmed: 'confirmed',         // 本予約
  cancelled: 'cancelled',         // 取消済み
  won: 'won',                     // 当選
  won_confirmed: 'won_confirmed', // 当選確定
  lottery_pending: 'lottery_pending', // 抽選待ち
  lost: 'lost',                   // 落選
} as const

export type ReservationStatusType = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS]

export const RESERVATION_STATUS_MAP: Record<string, ReservationStatusType> = {
  '本予約': 'confirmed',
  '取消済み': 'cancelled',
  '当選': 'won',
  '当選確定': 'won_confirmed',
  '抽選待ち': 'lottery_pending',
  '落選': 'lost',
}

export type Reservation = {
  date: string
  time: string
  facilityName: string
  status: ReservationStatusType
}

export type AccountConfig = {
  accounts: Account[]
}

export type ReservationResult = {
  accountId: string
  reservations: Reservation[]
}
