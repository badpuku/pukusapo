import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileResponse, ProfilesResponse } from "~/models/profiles";
import type { Database } from "~/models/supabase";

/**
 * 全てのプロファイルをロール情報と共に取得する
 */
export async function getProfiles(
  supabase: SupabaseClient<Database>,
): Promise<ProfilesResponse> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        roles(*)
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return { data: null, error: error.message };
    }

    return { data: data, error: null };
  } catch (err) {
    console.error("Unexpected error fetching profiles:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * 特定のプロファイルをIDで取得する
 */
export async function getProfileById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ProfileResponse> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        roles(*)
      `,
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return { data: null, error: error.message };
    }

    return { data: data, error: null };
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * ユーザーIDでプロファイルを取得する
 */
export async function getProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileResponse> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        roles(*)
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching profile by user_id:", error);
      return { data: null, error: error.message };
    }

    return { data: data, error: null };
  } catch (err) {
    console.error("Unexpected error fetching profile by user_id:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * ロール別でプロファイルを取得する
 */
export async function getProfilesByRole(
  supabase: SupabaseClient<Database>,
  roleId: number,
): Promise<ProfilesResponse> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        roles(*)
      `,
      )
      .eq("role_id", roleId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles by role:", error);
      return { data: null, error: error.message };
    }

    return { data: data, error: null };
  } catch (err) {
    console.error("Unexpected error fetching profiles by role:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
