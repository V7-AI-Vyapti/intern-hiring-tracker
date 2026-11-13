import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { BullmqConfigFactory } from '../config/bullmq-config.factory';
import type { BackgroundQueueDefinition } from './background-queue.types';

@Injectable()
export class BackgroundWorkerRegistryService implements OnModuleDestroy {
    private readonly workers: Worker[] = [];

    constructor(
        @Inject(BullmqConfigFactory)
        private readonly bullmqConfigFactory: BullmqConfigFactory,
    ) {}

    register<TJobData extends Record<string, unknown>>(
        definition: BackgroundQueueDefinition<TJobData>,
        processor: (job: Job<TJobData>) => Promise<void>,
    ): void {
        const worker = new Worker<TJobData>(
            this.queueName(definition),
            processor,
            {
                connection: this.bullmqConfigFactory.connectionOptions(),
            },
        );

        this.workers.push(worker);
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all(this.workers.map((worker) => worker.close()));
    }

    private queueName<TJobData extends Record<string, unknown>>(
        definition: BackgroundQueueDefinition<TJobData>,
    ): string {
        return this.bullmqConfigFactory.queueName(
            definition.configKey,
            definition.queueName,
        );
    }
}
