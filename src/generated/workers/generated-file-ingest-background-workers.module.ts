import { Module } from '@nestjs/common';
import { WorkerQueueInfrastructureModule } from '../../workers/worker-queue-infrastructure.module';

/**
 * File-ingest BullMQ processors register here via project generation codegen.
 */
@Module({
    imports: [WorkerQueueInfrastructureModule],
    providers: [],
})
export class GeneratedFileIngestBackgroundWorkersModule {}
