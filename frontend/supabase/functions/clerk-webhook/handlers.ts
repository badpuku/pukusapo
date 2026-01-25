import { UserJSON, DeletedObjectJSON } from "npm:@clerk/backend";
import { SupabaseClient } from "npm:@supabase/supabase-js";
import { ProfileData } from "./types.ts";
import { getFullName, getSafeUsername } from "./utils.ts";

export const handleUserCreated = async (
  data: UserJSON,
  supabase: SupabaseClient,
): Promise<Response> => {
  try {
    // デフォルトロール（user）のIDを取得
    const { data: defaultRole, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("code", "user")
      .eq("is_active", true)
      .single();

    if (roleError || !defaultRole) {
      console.error("Error getting default role:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to get default role" }),
        { status: 500 },
      );
    }

    // プロファイルデータを構築
    const profileData: Omit<
      ProfileData,
      "is_active" | "created_at" | "updated_at"
    > = {
      user_id: data.id,
      role_id: defaultRole.id,
      username: getSafeUsername(data.username),
      full_name: getFullName(data),
      avatar_url: data.image_url,
    };

    // プロファイルを作成
    const { error } = await supabase.from("profiles").insert([
      {
        ...profileData,
        is_active: true,
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date(data.updated_at).toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating user profile:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error in handleUserCreated:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
};

export const handleUserUpdated = async (
  data: UserJSON,
  supabase: SupabaseClient,
): Promise<Response> => {
  try {
    // Handle user update

    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        username: getSafeUsername(data.username),
        full_name: getFullName(data),
        avatar_url: data.image_url,
        updated_at: new Date(data.updated_at).toISOString(),
      })
      .eq("user_id", data.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ user }), { status: 200 });
  } catch (error) {
    console.error("Error in handleUserUpdated:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
};

export const handleUserDeleted = async (
  data: DeletedObjectJSON,
  supabase: SupabaseClient,
): Promise<Response> => {
  try {
    // ユーザーを物理削除ではなく論理削除（is_active = false）で処理
    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.id)
      .select()
      .single();

    if (error) {
      console.error("Error deactivating user profile:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    console.log("User profile deactivated:", user);
    return new Response(JSON.stringify({ success: true, user }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in handleUserDeleted:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
};

export const handleUnknownEvent = (
  eventType: string,
  eventData: unknown,
): Response => {
  console.log("Unhandled event type:", eventType);
  console.log("Full event:", JSON.stringify(eventData, null, 2));
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
