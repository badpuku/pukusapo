import { UserJSON } from "npm:@clerk/backend";
import { SupabaseClient } from "npm:@supabase/supabase-js";
import { ProfileData } from "./types.ts";
import { getFullName } from "./utils.ts";

export const handleUserCreated = async (
  data: UserJSON,
  supabase: SupabaseClient
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
        { status: 500 }
      );
    }

    // プロファイルデータを構築
    const profileData: Omit<ProfileData, 'is_active' | 'created_at' | 'updated_at'> = {
      user_id: data.id,
      role_id: defaultRole.id,
      username: data.username,
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

    console.log(
      "✅ User profile created successfully with role:",
      defaultRole.id
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error in handleUserCreated:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
};

export const handleUnknownEvent = (eventType: string, eventData: unknown): Response => {
  console.log("Unhandled event type:", eventType);
  console.log("Full event:", JSON.stringify(eventData, null, 2));
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};