import { z } from 'zod';
import { GENERATED_RBAC_FIELD_LIMITS } from '../rbac.constants';

const CatalogCreateSchema = z.object({
    resource: z
        .string()
        .trim()
        .min(1)
        .max(GENERATED_RBAC_FIELD_LIMITS.RESOURCE),
    actions: z.array(
        z.string().trim().min(1).max(GENERATED_RBAC_FIELD_LIMITS.ACTION),
    ),
});

export { CatalogCreateSchema };
