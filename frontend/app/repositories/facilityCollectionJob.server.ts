import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";

export async function findFacilityCollectionJobById(
  supabase: SupabaseClient<Database>,
  id: number,
) {
  return supabase.from("collection_jobs").select("*").eq("id", id).single();
}

export async function findAllFacilityCollectionJobs(
  supabase: SupabaseClient<Database>,
) {
  return supabase.from("collection_jobs").select("*").order("id", { ascending: false });
}

export async function createFacilityCollectionJob(
  supabase: SupabaseClient<Database>,
  data: Database["public"]["Tables"]["collection_jobs"]["Insert"],
) {
  return supabase.from("collection_jobs").insert(data).select().single();
}

export async function updateFacilityCollectionJob(
  supabase: SupabaseClient<Database>,
  id: number,
  data: Database["public"]["Tables"]["collection_jobs"]["Update"],
) {
  return supabase.from("collection_jobs").update(data).eq("id", id).select().single();
}

export async function deleteFacilityCollectionJob(
  supabase: SupabaseClient<Database>,
  id: number,
) {
  return supabase.from("collection_jobs").delete().eq("id", id);
}