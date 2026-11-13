import { Injectable } from '@nestjs/common';
import { ILike } from 'typeorm';
import { Process as ProcessEntity } from '@process-management/entities/process.entity';
import { readForeignKeyId } from '@vulcan/shared/utils/record-readers';
import { ProcessListQueryDto } from '@process-management/schema/process-list-query.schema';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type PaginatedListResult,
} from '@vulcan/shared/utils/list-query';

const PROCESS_LIST_SORT_COLUMNS = {
    processId: 'process_id',
    processName: 'process_name',
} as const;

@Injectable()
export class ListProcessService {
    async listProcesses(
        payload: ProcessListQueryDto,
    ): Promise<PaginatedListResult<unknown[]>> {
        const pagination = resolvePagination(payload);
        const search = normalizeSearch(payload.search);
        const where = this.buildWhere(search);
        const order = buildAllowedOrder({
            columns: PROCESS_LIST_SORT_COLUMNS,
            sortBy: payload.sortBy,
            sortOrder: payload.sortOrder,
            defaultSortBy: 'processId',
        });

        const [processes, total] = await Promise.all([
            ProcessEntity.selectRelated(
                where,
                {
                    process_status_id: true,
                } as Record<string, boolean>,
                {
                    order,
                    skip: pagination.skip,
                    take: pagination.take,
                },
            ),
            ProcessEntity.countOf(where),
        ]);

        const items = processes.map((processRow) => {
            const record = processRow as unknown as Record<string, unknown>;
            const processStatus = record['process_status_id'] as
                | Record<string, unknown>
                | undefined;

            return {
                ...record,
                process_status_id: readForeignKeyId(
                    processRow,
                    'process_status_id',
                    'operation_status_id',
                ),
                process_status_name:
                    (processStatus?.['operation_status_name'] as
                        | string
                        | undefined) ?? null,
            };
        });

        return {
            items,
            total,
            pagination,
        };
    }

    private buildWhere(search: string | null): Record<string, unknown> {
        if (!search) return {};
        return { process_name: ILike(`%${search}%`) };
    }
}
