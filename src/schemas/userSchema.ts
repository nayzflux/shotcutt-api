import { z } from "zod";

export const updateUserSchema = z.object({
  username: z.string(),
  name: z.string(),
});
