import { Module } from '@nestjs/common';
import { WorkerQueueInfrastructureModule } from '../../workers/worker-queue-infrastructure.module';
import { FileManagementModule } from './file-management.module';
import { FileManagementWorkerRegistrar } from './workers/file-management-worker.registrar';

@Module({
    imports: [WorkerQueueInfrastructureModule, FileManagementModule],
    providers: [FileManagementWorkerRegistrar],
})
export class FileManagementWorkersModule {}
