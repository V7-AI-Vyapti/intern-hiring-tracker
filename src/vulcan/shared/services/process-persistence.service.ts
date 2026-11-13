import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
    createProcessEntity,
    type CreateProcessEntityPayload,
} from '@vulcan/shared/utils/create-process-entity.util';
import {
    updateProcessStatus,
    type UpdateProcessStatusPayload,
} from '@vulcan/shared/utils/update-process-status.util';

@Injectable()
export class ProcessPersistenceService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    createProcessEntity(payload: CreateProcessEntityPayload): Promise<number> {
        return createProcessEntity({
            dataSource: this.dataSource,
            ...payload,
        });
    }

    updateProcessStatus(payload: UpdateProcessStatusPayload): Promise<void> {
        return updateProcessStatus({
            dataSource: this.dataSource,
            ...payload,
        });
    }
}
