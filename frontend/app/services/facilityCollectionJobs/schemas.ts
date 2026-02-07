import { z } from "zod";

import { FacilityCollectionJobStatusSchema } from "~/models/facilityCollectionJob";

export const FacilityCollectionJobResponseSchema = z.object({
  id: z.number(),
  status: FacilityCollectionJobStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type FacilityCollectionJobResponse = z.infer<typeof FacilityCollectionJobResponseSchema>;