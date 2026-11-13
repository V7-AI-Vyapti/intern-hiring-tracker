import { z } from 'zod';

export const FileUploadMultipartSchema = z.object({
    buffer: z.instanceof(Buffer),
    originalname: z.string().optional(),
    mimetype: z.string().optional(),
    size: z.number().optional(),
});

export type FileUploadMultipartPayload = z.infer<
    typeof FileUploadMultipartSchema
>;
