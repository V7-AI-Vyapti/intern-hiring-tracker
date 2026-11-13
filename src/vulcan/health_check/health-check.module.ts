import { Module } from '@nestjs/common';
import { HealthCheckController } from './controller/health-check.controller';
import { HealthCheckService } from './services/health-check.service';

@Module({
    imports: [],
    controllers: [HealthCheckController],
    providers: [HealthCheckService],
    exports: [],
})
export class HealthCheckModule {}
