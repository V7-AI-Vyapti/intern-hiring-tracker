import { ConvertExcelToCsvApi } from '@file-management/controllers/files.controllers/convert-excel-to-csv.controller';

describe('ConvertExcelToCsvApi', () => {
    let controller: ConvertExcelToCsvApi;
    let triggerExcelToCsvService: { triggerExcelToCsv: jest.Mock };

    beforeEach(() => {
        triggerExcelToCsvService = { triggerExcelToCsv: jest.fn() };
        controller = new ConvertExcelToCsvApi(
            triggerExcelToCsvService as never,
        );
    });

    it('convertExcelToCsv delegates to trigger service with fileId', async () => {
        const params = { fileId: 42 } as never;
        const expected = {
            job_id: 'job-1',
            status: 'queued',
        };
        triggerExcelToCsvService.triggerExcelToCsv.mockResolvedValue(expected);

        const result = await controller.convertExcelToCsv(params);

        expect(triggerExcelToCsvService.triggerExcelToCsv).toHaveBeenCalledWith(
            42,
        );
        expect(result.data).toBe(expected);
    });
});
