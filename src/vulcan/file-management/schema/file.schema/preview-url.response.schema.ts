import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PreviewUrlResponseSchema = z.object({
    previewUrl: z.string(),
});
export class PreviewUrlResponseDto extends createZodDto(
    PreviewUrlResponseSchema,
) {}
