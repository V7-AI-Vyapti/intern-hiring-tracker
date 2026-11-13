import { Module } from '@nestjs/common';
import { BullmqConfigFactory } from '../config/bullmq-config.factory';
import { BackgroundQueueService } from './background-queue.service';

@Module({
    providers: [BullmqConfigFactory, BackgroundQueueService],
    exports: [BullmqConfigFactory, BackgroundQueueService],
})
export class BackgroundQueueModule {}
