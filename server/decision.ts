import { z } from 'zod';
export const DecisionSchema=z.object({
 text:z.string().trim().min(1).max(600),
 stance:z.enum(['accept','deny','question','deflect']),
 shareWith:z.enum(['public','mara','len','sysop','none']),
 trustDelta:z.number().int().min(-2).max(2),
 memory:z.string().trim().min(1).max(160)
}).strict();
export type Decision=z.infer<typeof DecisionSchema>;
