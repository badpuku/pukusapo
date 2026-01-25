export interface DatabaseCredentials {
  supabaseUrl: string;
  supabaseServiceKey: string;
}

// NOTE: Database schema は snake_case で定義されているため、ここでは snake_case に合わせている
export interface ProfileData {
  user_id: string;
  role_id: number;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}