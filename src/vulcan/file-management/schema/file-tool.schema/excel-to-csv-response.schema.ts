import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ExcelToCsvSheetResponseSchema = z.object({
    sheetName: z.string(),
    csvFileName: z.string(),
    fileId: z.number().int(),
});

const ExcelToCsvResponseSchema = z.object({
    sourceFileId: z.number().int(),
    sheets: z.array(ExcelToCsvSheetResponseSchema),
});

class ExcelToCsvSheetResponseDto extends createZodDto(
    ExcelToCsvSheetResponseSchema,
) {}

class ExcelToCsvResponseDto extends createZodDto(ExcelToCsvResponseSchema) {}

export {
    ExcelToCsvResponseDto,
    ExcelToCsvResponseSchema,
    ExcelToCsvSheetResponseDto,
    ExcelToCsvSheetResponseSchema,
};
