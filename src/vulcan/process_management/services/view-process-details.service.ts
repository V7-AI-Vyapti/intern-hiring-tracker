import { Injectable, NotFoundException } from '@nestjs/common';
import { Process as ProcessEntity } from '@process-management/entities/process.entity';
import { type ProcessDetailsItem } from '@process-management/schema/process-details.schema';
import { serializeProcessDetails } from '@process-management/serializers/process-details.serializer';

@Injectable()
export class ViewProcessDetailsService {
    async viewProcessDetails(processId: number): Promise<ProcessDetailsItem> {
        const process = await ProcessEntity.getByPk(processId, {
            relations: { tool_id: true, process_status_id: true },
        });
        if (!process) {
            throw new NotFoundException(
                `Process not found: process_id=${processId}`,
            );
        }

        return serializeProcessDetails(process);
    }
}
