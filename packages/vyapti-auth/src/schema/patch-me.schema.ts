import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PatchMeRequestSchema = z
    .object({
        email: z.string().trim().email().toLowerCase().optional(),
        display_name: z.string().trim().min(1).max(200).optional(),
    })
    .refine((value) => value.email !== undefined || value.display_name !== undefined, {
        message: 'At least one field is required',
    });

class PatchMeRequestDto extends createZodDto(PatchMeRequestSchema) {}

type PatchMeRequestInput = z.infer<typeof PatchMeRequestSchema>;

export { PatchMeRequestDto, PatchMeRequestSchema };
export type { PatchMeRequestInput };
