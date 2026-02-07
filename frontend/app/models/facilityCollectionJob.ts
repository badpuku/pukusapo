import { z } from "zod";

export const FacilityCollectionJobStatusSchema = z.enum(["running", "completed", "failed"]);
export type FacilityCollectionJobStatus = z.infer<typeof FacilityCollectionJobStatusSchema>;

export const FacilityCollectionJobInputSchema = z.object({
  status: FacilityCollectionJobStatusSchema,
});
export type FacilityCollectionJobInput = z.infer<typeof FacilityCollectionJobInputSchema>;

export const FacilityCollectionJobUpdateInputSchema = FacilityCollectionJobInputSchema.extend({});
export type FacilityCollectionJobUpdateInput = z.infer<typeof FacilityCollectionJobUpdateInputSchema>;