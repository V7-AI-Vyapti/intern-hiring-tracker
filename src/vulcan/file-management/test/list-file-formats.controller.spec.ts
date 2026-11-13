import { FileFormatsListApi } from '@file-management/controllers/file-formats.controllers/list-file-formats.controller';

describe('FileFormatsListApi', () => {
    let controller: FileFormatsListApi;
    let service: { listFileFormats: jest.Mock };

    beforeEach(() => {
        service = { listFileFormats: jest.fn() };
        controller = new FileFormatsListApi(service as never);
    });

    it('listFileFormats calls service with query', async () => {
        const query = { page: 1, limit: 20 } as never;
        const expected = { items: [] };
        service.listFileFormats.mockResolvedValue(expected);

        const result = await controller.listFileFormats(query);

        expect(service.listFileFormats).toHaveBeenCalledWith(query);
        expect(result.data).toBe(expected);
    });
});
