import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BundleIdParamsSchema = z.object({
    bundleId: z.string().trim().min(1),
});

class BundleIdParamsDto extends createZodDto(BundleIdParamsSchema) {}

export { BundleIdParamsDto };
