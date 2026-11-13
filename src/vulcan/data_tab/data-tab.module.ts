import { Module } from '@nestjs/common';
import { ListEntityController } from '@data-tab/controller/list-entity.controller';
import { ListEntityDatapointsController } from '@data-tab/controller/list-entity-datapoints.controller';
import { ListEntityToolsController } from '@data-tab/controller/list-entity-tools.controller';
import { ListEntitiesService } from '@data-tab/services/list-entities.service';
import { ListEntityDatapointsService } from '@data-tab/services/list-entity-datapoints.service';
import { ListEntityToolsService } from '@data-tab/services/list-entity-tools.service';

@Module({
    imports: [],
    controllers: [
        ListEntityController,
        ListEntityDatapointsController,
        ListEntityToolsController,
    ],
    providers: [
        ListEntitiesService,
        ListEntityDatapointsService,
        ListEntityToolsService,
    ],
    exports: [],
})
export class DataTabModule {}
