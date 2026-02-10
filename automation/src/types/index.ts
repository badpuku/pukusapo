import { z } from "zod";

export const RESERVATION_STATUS = {
  confirmed: "confirmed", // 本予約
  cancelled: "cancelled", // 取消済み
  won: "won", // 当選
  won_confirmed: "won_confirmed", // 当選確定
  lottery_pending: "lottery_pending", // 抽選待ち
  lost: "lost", // 落選
} as const;

export const ReservationStatusSchema = z.enum(
  Object.values(RESERVATION_STATUS) as [string, ...string[]],
);

export type ReservationStatusType =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

export const RESERVATION_STATUS_MAP: Record<string, ReservationStatusType> = {
  本予約: "confirmed",
  取消済み: "cancelled",
  当選: "won",
  当選確定: "won_confirmed",
  抽選待ち: "lottery_pending",
  落選: "lost",
};

export const ReservationSchema = z.object({
  date: z.string(),
  time: z.string(),
  facilityName: z.string(),
  status: ReservationStatusSchema,
});

export type Reservation = z.infer<typeof ReservationSchema>;

// Seed用: Google Sheets から読み込む生データ
export const FacilityAccountSeedSchema = z.object({
  userId: z.string(),
  password: z.string(),
  circleName: z.string().nullable(),
  representativeName: z.string().nullable(),
});
export type FacilityAccountSeed = z.infer<typeof FacilityAccountSeedSchema>;

// APIレスポンス: 実際のAPIが返す形 (snake_case, encrypted_password)
export const FacilityAccountApiResponseSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  user_id: z.string(),
  encrypted_password: z.string(),
  circle_name: z.string().nullable(),
  representative_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FacilityAccountApiResponse = z.infer<typeof FacilityAccountApiResponseSchema>;

// APIレスポンスのラッパー
export const FacilityAccountApiListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(FacilityAccountApiResponseSchema),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  status: z.number(),
});
export type FacilityAccountApiListResponse = z.infer<typeof FacilityAccountApiListResponseSchema>;

// 作業用: Playwright が使うモデル (復号済み password, camelCase)
export const FacilityAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  password: z.string(), // decrypted
  circleName: z.string().nullable(),
  representativeName: z.string().nullable(),
});
export type FacilityAccount = z.infer<typeof FacilityAccountSchema>;

export const ReservationResultSchema = z.object({
  accountId: z.string(),
  reservations: z.array(ReservationSchema),
});

export type ReservationResult = z.infer<typeof ReservationResultSchema>;

export type ReservationRequest = {
  reservations: ReservationResult[];
};

export type CollectionJob = {
  id: number;
  collected_at: string;
  status: string;
};
