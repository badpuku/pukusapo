import { createClerkClient } from "@clerk/react-router/api.server";
import { clerkClient } from "@clerk/react-router/server";
import { getAuth } from "@clerk/react-router/ssr.server";
import { data } from "react-router";
import { z } from "zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";

export const FormsListSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        created_at: z.string(),
        updated_at: z.string().nullable(),
      }),
    )
    .nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type FormsListResponse = z.infer<typeof FormsListSchema>;

const paramsSchema = z.object({
  offset: z.number().default(0),
});

const MOCK_DATA = [
  {
    id: "1",
    title: "フォーム1",
    status: "公開中",
    created_at: "2026-01-01 10:00:00",
    updated_at: "2026-01-02 12:00:00",
  },
  {
    id: "2",
    title: "フォーム2",
    status: "非公開",
    created_at: "2026-01-01 10:00:00",
    updated_at: "",
  },
];

export const action = async (args: Route.ActionArgs) => {
  // 認証チェック
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "",
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED] },
    );
  }

  /* const params = await args.request.json();
  const validatedParams = paramsSchema.safeParse(params);
  if (!validatedParams.success) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR] },
    );
  }

  const { offset } = validatedParams.data; */

  return data(
    {
      success: true,
      data: MOCK_DATA,
    },
    { status: 200 },
  );
};
