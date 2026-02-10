import { getAuth } from "@clerk/react-router/ssr.server";
import type { ActionFunctionArgs,LoaderFunctionArgs} from "react-router";

import type { ApiKeyAuthContext,AuthContext, BaseAuthContext } from "~/lib/auth/types";
import { findProfileByUserId } from "~/repositories/profiles.server";
import { ProfileResponseSchema } from "~/services/profiles/schemas";
import { createSecretSupabaseClient,createServerSupabaseClient } from "~/services/supabase/client.server";

/**
 * 認証のみ確認（プロフィール未取得）
 * 軽量な認証チェックが必要な場合に使用
 */
export async function authenticate(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<BaseAuthContext | null> {
  const auth = await getAuth(args);
  if (!auth.userId) return null;

  return {
    userId: auth.userId,
    supabase: createServerSupabaseClient(args),
    env: args.context.cloudflare.env,
  };
}

/**
 * 認証 + プロフィール取得
 * 権限チェックが必要なサービスで使用
 */
export async function authenticateWithProfile(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<AuthContext | null> {
  const baseCtx = await authenticate(args);
  if (!baseCtx) return null;

  const { data: profile, error: profileError } = await findProfileByUserId(
    baseCtx.supabase,
    baseCtx.userId
  );
  if (profileError) return null;
  if (!profile) return null;

  const profileData = ProfileResponseSchema.safeParse(profile);
  if (!profileData.success) return null;

  return {
    ...baseCtx,
    profile: profileData.data,
  };
}

/**
 * APIキー認証
 */
export async function authenticateWithApiKey(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<ApiKeyAuthContext | null> {
  const apiKey = args.request.headers.get("X-API-Key");
  const expectedKey = args.context.cloudflare.env.AUTOMATION_API_KEY;
  if (!apiKey || apiKey !== expectedKey) return null;
  return {
    supabase: createSecretSupabaseClient(args),
    env: args.context.cloudflare.env,
  };
}

/**
 * Clerk 認証 + APIキー認証
 */
export async function authenticateWithClerkAndApiKey(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<AuthContext | ApiKeyAuthContext | null> {
  const authCtx = await authenticateWithProfile(args);
  if (authCtx) return authCtx;

  return await authenticateWithApiKey(args);
}