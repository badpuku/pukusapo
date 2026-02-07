import { z } from "zod";

export const FacilityCollectionJobInputSchema = z.object({
  status: z.enum(["running", "completed", "failed"]),
});
export type FacilityCollectionJobInput = z.infer<typeof FacilityCollectionJobInputSchema>;

export const FacilityCollectionJobUpdateInputSchema = FacilityCollectionJobInputSchema.extend({});
export type FacilityCollectionJobUpdateInput = z.infer<typeof FacilityCollectionJobUpdateInputSchema>;