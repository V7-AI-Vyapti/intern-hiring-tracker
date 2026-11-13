import { Module } from '@nestjs/common';
import { ListProcessController } from '@process-management/controller/list-process.controller';
import { ViewProcessDetailsController } from '@process-management/controller/view-process-details.controller';
import { ListProcessService } from '@process-management/services/list-process.service';
import { ViewProcessDetailsService } from '@process-management/services/view-process-details.service';

@Module({
    imports: [],
    controllers: [ListProcessController, ViewProcessDetailsController],
    providers: [ListProcessService, ViewProcessDetailsService],
    exports: [],
})
export class ProcessManagementModule {}
