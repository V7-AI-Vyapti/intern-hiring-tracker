import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BullmqConfigFactory } from '../config/bullmq-config.factory';
import type {
    BackgroundJobEnqueueResponse,
    BackgroundQueueDefinition,
} from './background-queue.types';

@Injectable()
export class BackgroundQueueService implements OnModuleDestroy {
    private readonly queues = new Map<string, Queue<any, any, string>>();

    constructor(private readonly bullmqConfigFactory: BullmqConfigFactory) {}

    async add<TJobData extends Record<string, unknown>>(
        definition: BackgroundQueueDefinition<TJobData>,
        data: TJobData,
    ): Promise<BackgroundJobEnqueueResponse> {
        const queue = this.getQueue(definition);
        const job = await queue.add(definition.jobName, data);

        return {
            job_id: String(job.id),
            status: 'queued',
        };
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all(
            [...this.queues.values()].map((queue) => queue.close()),
        );
    }

    private getQueue<TJobData extends Record<string, unknown>>(
        definition: BackgroundQueueDefinition<TJobData>,
    ): Queue<any, any, string> {
        const queueName = this.queueName(definition);
        const existingQueue = this.queues.get(queueName);

        if (existingQueue) {
            return existingQueue;
        }

        const queue = new Queue<any, any, string>(queueName, {
            connection: this.bullmqConfigFactory.connectionOptions(),
            defaultJobOptions: this.bullmqConfigFactory.defaultJobOptions(
                definition.configKey,
            ),
        });

        this.queues.set(queueName, queue);
        return queue;
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
