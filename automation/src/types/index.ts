import { z } from "zod";

export type Account = {
  userId: string
  password: string
  circleName?: string
  representativeName?: string
}

export const RESERVATION_STATUS = {
  confirmed: 'confirmed',         // 本予約
  cancelled: 'cancelled',         // 取消済み
  won: 'won',                     // 当選
  won_confirmed: 'won_confirmed', // 当選確定
  lottery_pending: 'lottery_pending', // 抽選待ち
  lost: 'lost',                   // 落選
} as const;

export const ReservationStatusSchema = z.enum(Object.values(RESERVATION_STATUS) as [string, ...string[]]);

export type ReservationStatusType = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS]

export const RESERVATION_STATUS_MAP: Record<string, ReservationStatusType> = {
  '本予約': 'confirmed',
  '取消済み': 'cancelled',
  '当選': 'won',
  '当選確定': 'won_confirmed',
  '抽選待ち': 'lottery_pending',
  '落選': 'lost',
}

export const ReservationSchema = z.object({
  date: z.string(),
  time: z.string(),
  facilityName: z.string(),
  status: ReservationStatusSchema,
});

export type Reservation = z.infer<typeof ReservationSchema>;

export type AccountConfig = {
  accounts: Account[]
}


export const ReservationResultSchema = z.object({
  accountId: z.string(),
  reservations: z.array(ReservationSchema),
});

export type ReservationResult = z.infer<typeof ReservationResultSchema>;

export type ReservationRequest = {
  reservations: ReservationResult[]
}

export type CollectionJob = {
  id: number
  collected_at: string
  status: string
}
