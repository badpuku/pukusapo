import { z } from "zod";

export const FacilityCollectionJobUpdateInputSchema = z.object({
  status: z.enum(["running", "completed", "failed"]),
});

export type FacilityCollectionJobUpdateInput = z.infer<typeof FacilityCollectionJobUpdateInputSchema>;