import {
    ExcelToCsvResponseDto,
    ExcelToCsvResponseSchema,
} from '@file-management/schema/file-tool.schema/excel-to-csv-response.schema';

function buildExcelToCsvResponse(args: {
    sourceFileId: number;
    sheets: Array<{
        sheetName: string;
        csvFileName: string;
        fileId: number;
    }>;
}): ExcelToCsvResponseDto {
    const parsed = ExcelToCsvResponseSchema.parse({
        sourceFileId: args.sourceFileId,
        sheets: args.sheets,
    });

    return Object.assign(new ExcelToCsvResponseDto(), parsed);
}

export { buildExcelToCsvResponse };
