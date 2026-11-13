import { Module } from '@nestjs/common';
import { BackgroundQueueModule } from '../core/queue/background-queue.module';
import { BackgroundWorkerRegistryService } from '../core/queue/background-worker-registry.service';

@Module({
    imports: [BackgroundQueueModule],
    providers: [BackgroundWorkerRegistryService],
    exports: [BackgroundQueueModule, BackgroundWorkerRegistryService],
})
export class WorkerQueueInfrastructureModule {}
