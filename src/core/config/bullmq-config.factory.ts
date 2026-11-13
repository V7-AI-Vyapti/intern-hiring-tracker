import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JobsOptions, QueueOptions } from 'bullmq';

@Injectable()
export class BullmqConfigFactory {
    constructor(
        @Inject(ConfigService)
        private readonly configService: ConfigService,
    ) {}

    connectionOptions(): QueueOptions['connection'] {
        return {
            host:
                this.configService.get<string>('queue.redis.host') ??
                '127.0.0.1',
            port: this.configService.get<number>('queue.redis.port') ?? 6379,
            username:
                this.configService.get<string | undefined>(
                    'queue.redis.username',
                ) ?? undefined,
            password:
                this.configService.get<string | undefined>(
                    'queue.redis.password',
                ) ?? undefined,
            db: this.configService.get<number>('queue.redis.db') ?? 0,
            maxRetriesPerRequest: null,
        };
    }

    defaultJobOptions(queueConfigKey: string): JobsOptions {
        return {
            attempts:
                this.configService.get<number>(
                    `queue.${queueConfigKey}.attempts`,
                ) ?? 1,
            removeOnComplete:
                this.configService.get<number>(
                    `queue.${queueConfigKey}.removeOnComplete`,
                ) ?? 100,
            removeOnFail:
                this.configService.get<number>(
                    `queue.${queueConfigKey}.removeOnFail`,
                ) ?? 100,
        };
    }

    queueName(queueConfigKey: string, fallback: string): string {
        return (
            this.configService.get<string>(
                `queue.${queueConfigKey}.queueName`,
            ) ?? fallback
        );
    }
}
