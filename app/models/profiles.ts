import type { Tables } from "~/models/supabase";

export type Profile = Tables<"profiles"> & {
  roles: Tables<"roles">;
};

export type ProfileResponse = {
  data: Profile | null;
  error: string | null;
};

export type ProfilesResponse = {
  data: Profile[] | null;
  error: string | null;
};
