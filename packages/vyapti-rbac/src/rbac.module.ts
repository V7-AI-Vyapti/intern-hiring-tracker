import {
    DynamicModule,
    Module,
    type Provider,
    type Type,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { BundlesController } from './controller/bundles.controller.js';
import { CatalogController } from './controller/catalog.controller.js';
import { RolesController } from './controller/roles.controller.js';
import { SessionController } from './controller/session.controller.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import {
    RBAC_MODULE_OPTIONS,
    RBAC_PERSISTENCE_ADAPTER,
} from './rbac.tokens.js';
import { AssertPermissionService } from './services/assert-permission.service.js';
import { BundlesService } from './services/bundles.service.js';
import { CatalogGrantsService } from './services/catalog-grants.service.js';
import { CatalogService } from './services/catalog.service.js';
import { EffectiveGrantsService } from './services/effective-grants.service.js';
import { PermissionCacheService } from './services/permission-cache.service.js';
import { PermissionCheckService } from './services/permission-check.service.js';
import { RolesService } from './services/roles.service.js';
import { SessionService } from './services/session.service.js';
import type { RbacModuleRootOptions } from './types/rbac.types.js';
import { applyControllerPath } from './utils/apply-controller-path.util.js';
import { resolveRbacModuleOptions } from './utils/resolve-rbac-module-options.util.js';

const RBAC_ADMIN_CONTROLLERS: Array<Type<unknown>> = [
    CatalogController,
    SessionController,
    RolesController,
    BundlesController,
];

const RBAC_SERVICES: Provider[] = [
    PermissionCacheService,
    EffectiveGrantsService,
    CatalogGrantsService,
    CatalogService,
    PermissionCheckService,
    AssertPermissionService,
    RolesService,
    BundlesService,
    SessionService,
];

@Module({})
class RbacModule {
    static forRoot(options: RbacModuleRootOptions): DynamicModule {
        const resolved = resolveRbacModuleOptions(options);
        const controllers = resolved.adminApi ? RBAC_ADMIN_CONTROLLERS : [];

        applyControllerPath({
            controllers,
            path: resolved.routePrefix,
        });

        return {
            module: RbacModule,
            global: false,
            controllers,
            providers: [
                {
                    provide: RBAC_MODULE_OPTIONS,
                    useValue: resolved,
                },
                {
                    provide: RBAC_PERSISTENCE_ADAPTER,
                    useValue: options.persistence,
                },
                Reflector,
                ...RBAC_SERVICES,
                PermissionsGuard,
                {
                    provide: APP_GUARD,
                    useExisting: PermissionsGuard,
                },
            ],
            exports: [
                RBAC_MODULE_OPTIONS,
                RBAC_PERSISTENCE_ADAPTER,
                PermissionsGuard,
                AssertPermissionService,
            ],
        };
    }
}

export { RbacModule };
