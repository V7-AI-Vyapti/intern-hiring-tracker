import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerApplicationModule } from './workers/worker-application.module';

async function bootstrap() {
    const app =
        await NestFactory.createApplicationContext(WorkerApplicationModule);
    app.enableShutdownHooks();

    new Logger('BackgroundWorker').log('Background worker is listening for jobs');
}

void bootstrap();
