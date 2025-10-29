import { getAuth } from "@clerk/react-router/ssr.server";
import { data } from "react-router";

import { createServerSupabaseClient } from "~/services/supabase/client.server";

import type { Route } from "./+types/route";
import { createFormSchema } from "./validation";

export const action = async (args: Route.ActionArgs) => {
  const { request } = args;

  // 1. 認証チェック
  const { userId } = await getAuth(args);
  if (!userId) {
    return data(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "認証が必要です",
        },
      },
      { status: 401 },
    );
  }

  // 2. リクエストボディの取得とバリデーション
  let requestData: unknown;
  try {
    requestData = await request.json();
  } catch {
    return data(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "不正なJSONフォーマットです",
        },
      },
      { status: 400 },
    );
  }

  const validation = createFormSchema.safeParse(requestData);
  if (!validation.success) {
    return data(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "入力内容に誤りがあります",
          details: validation.error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  const { title, description, status } = validation.data;

  // 3. Supabaseクライアント生成
  const supabase = createServerSupabaseClient(args);

  // 4. ユーザーのprofile.idを取得
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role_id")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    return data(
      {
        success: false,
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "ユーザープロフィールが見つかりません",
        },
      },
      { status: 403 },
    );
  }

  // 5. フォームをデータベースに作成
  const { data: newForm, error: insertError } = await supabase
    .from("forms")
    .insert({
      title,
      description: description || null,
      status,
      created_by: profile.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Form creation error:", insertError);
    return data(
      {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "フォームの作成に失敗しました",
        },
      },
      { status: 500 },
    );
  }

  // 6. 成功レスポンス
  return data(
    {
      success: true,
      data: newForm,
    },
    { status: 201 },
  );
};