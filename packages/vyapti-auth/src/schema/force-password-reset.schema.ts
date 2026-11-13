import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

function emptyBody(value: unknown): unknown {
    if (value == null) {
        return {};
    }
    return value;
}

const ForcePasswordResetRequestSchema = z.preprocess(
    emptyBody,
    z.object({
        otp: z.boolean().optional(),
    }),
);

class ForcePasswordResetRequestDto extends createZodDto(
    ForcePasswordResetRequestSchema,
) {}

export { ForcePasswordResetRequestDto, ForcePasswordResetRequestSchema };
