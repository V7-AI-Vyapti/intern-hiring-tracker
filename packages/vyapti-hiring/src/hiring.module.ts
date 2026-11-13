import { DynamicModule, Module, type Provider, type Type } from '@nestjs/common';
import { HiringController } from './controller/hiring.controller.js';
import { HIRING_MODULE_OPTIONS, HIRING_PERSISTENCE } from './hiring.tokens.js';
import { DashboardSummaryService } from './services/dashboard-summary.service.js';
import { HiringActionsService } from './services/hiring-actions.service.js';
import { PublicApplyService } from './services/public-apply.service.js';
import type { HiringModuleRootOptions } from './types/hiring.types.js';
import { applyControllerPath } from './utils/apply-controller-path.util.js';
import { resolveHiringModuleOptions } from './utils/resolve-hiring-module-options.util.js';

const HIRING_CONTROLLERS: Array<Type<unknown>> = [HiringController];

const HIRING_SERVICES: Provider[] = [
    HiringActionsService,
    DashboardSummaryService,
    PublicApplyService,
];

@Module({})
class HiringModule {
    static forRoot(options: HiringModuleRootOptions): DynamicModule {
        const resolved = resolveHiringModuleOptions(options);
        applyControllerPath({
            controllers: HIRING_CONTROLLERS,
            path: resolved.routePrefix,
        });

        return {
            module: HiringModule,
            global: false,
            controllers: HIRING_CONTROLLERS,
            providers: [
                {
                    provide: HIRING_MODULE_OPTIONS,
                    useValue: resolved,
                },
                {
                    provide: HIRING_PERSISTENCE,
                    useValue: options.persistence,
                },
                ...HIRING_SERVICES,
            ],
            exports: [
                HIRING_MODULE_OPTIONS,
                HIRING_PERSISTENCE,
                HiringActionsService,
                DashboardSummaryService,
                PublicApplyService,
            ],
        };
    }
}

export { HiringModule };
