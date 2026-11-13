import { z } from 'zod';

const ApiKeyCreateSchema = z.object({
    user_id: z.number().int().positive(),
    prefix: z.string().trim().min(1).max(32),
    token_hash: z.string().length(64),
    name: z.string().trim().min(1).max(200).nullable(),
    created_at: z.string().min(1).max(64),
    revoked_at: z.string().min(1).max(64).nullable(),
});

type ApiKeyCreateInput = z.infer<typeof ApiKeyCreateSchema>;

export { ApiKeyCreateSchema };
export type { ApiKeyCreateInput };
