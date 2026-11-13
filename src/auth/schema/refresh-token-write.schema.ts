import { z } from 'zod';

const RefreshTokenCreateSchema = z.object({
    user_id: z.number().int().positive(),
    token_hash: z.string().length(64),
    expires_at: z.string().min(1).max(64),
});

type RefreshTokenCreateInput = z.infer<typeof RefreshTokenCreateSchema>;

export { RefreshTokenCreateSchema };
export type { RefreshTokenCreateInput };
