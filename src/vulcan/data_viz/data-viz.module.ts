import { Module } from '@nestjs/common';
import { VizConfigController } from './controller/viz-config.controller';
import { VizDataController } from './controller/viz-data.controller';
import { VizConfigService } from './services/viz-config.service';
import { VizDataService } from './services/viz-data.service';

@Module({
    imports: [],
    controllers: [VizConfigController, VizDataController],
    providers: [VizConfigService, VizDataService],
    exports: [],
})
export class DataVizModule {}
