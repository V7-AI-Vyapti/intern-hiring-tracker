import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const IssueApiKeyRequestSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
});

class IssueApiKeyRequestDto extends createZodDto(IssueApiKeyRequestSchema) {}

type IssueApiKeyRequestInput = z.infer<typeof IssueApiKeyRequestSchema>;

export { IssueApiKeyRequestDto, IssueApiKeyRequestSchema };
export type { IssueApiKeyRequestInput };
