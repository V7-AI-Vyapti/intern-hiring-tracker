import { Module } from '@nestjs/common';
import { DataTabModule } from './data_tab/data-tab.module';
import { ProcessManagementModule } from './process_management/process-management.module';
import { FileManagementModule } from './file-management/file-management.module';
import { HealthCheckModule } from './health_check/health-check.module';
import { DataVizModule } from './data_viz/data-viz.module';
@Module({
    imports: [
        HealthCheckModule,
        DataTabModule,
        ProcessManagementModule,
        FileManagementModule,
        DataVizModule,
    ],
})
export class VulcanModule {}
