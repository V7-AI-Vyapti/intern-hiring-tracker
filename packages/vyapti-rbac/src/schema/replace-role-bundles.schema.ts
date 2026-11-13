import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RBAC_FIELD_LIMITS } from '../rbac.constants.js';

const ReplaceRoleBundlesSchema = z.object({
    bundle_ids: z
        .array(z.string().trim().min(1))
        .max(RBAC_FIELD_LIMITS.BUNDLE_LIST),
});

class ReplaceRoleBundlesRequestDto extends createZodDto(
    ReplaceRoleBundlesSchema,
) {}

export { ReplaceRoleBundlesRequestDto };
