import {
    DynamicModule,
    Module,
    type Provider,
    type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
    ACCESS_POLICY_MODULE_OPTIONS,
    ACCESS_POLICY_PERSISTENCE_ADAPTER,
} from './access-policy.tokens.js';
import { MembershipsController } from './controller/memberships.controller.js';
import { PoliciesController } from './controller/policies.controller.js';
import { SessionController } from './controller/session.controller.js';
import { AccessPolicyInterceptor } from './interceptors/access-policy.interceptor.js';
import { AccessPolicyCacheService } from './services/access-policy-cache.service.js';
import { AccessPolicyFilterService } from './services/access-policy-filter.service.js';
import { MembershipsService } from './services/memberships.service.js';
import { PoliciesService } from './services/policies.service.js';
import { SessionService } from './services/session.service.js';
import type { AccessPolicyModuleRootOptions } from './types/access-policy.types.js';
import { applyControllerPath } from './utils/apply-controller-path.util.js';
import { resolveAccessPolicyModuleOptions } from './utils/resolve-module-options.util.js';

const ACCESS_POLICY_ADMIN_CONTROLLERS: Array<Type<unknown>> = [
    SessionController,
    PoliciesController,
    MembershipsController,
];

const ACCESS_POLICY_SERVICES: Provider[] = [
    AccessPolicyCacheService,
    AccessPolicyFilterService,
    PoliciesService,
    MembershipsService,
    SessionService,
    AccessPolicyInterceptor,
];

@Module({})
class AccessPolicyModule {
    static forRoot(options: AccessPolicyModuleRootOptions): DynamicModule {
        const resolved = resolveAccessPolicyModuleOptions(options);
        const controllers = resolved.adminApi
            ? ACCESS_POLICY_ADMIN_CONTROLLERS
            : [];

        applyControllerPath({
            controllers,
            path: resolved.routePrefix,
        });

        return {
            module: AccessPolicyModule,
            global: false,
            controllers,
            providers: [
                {
                    provide: ACCESS_POLICY_MODULE_OPTIONS,
                    useValue: resolved,
                },
                {
                    provide: ACCESS_POLICY_PERSISTENCE_ADAPTER,
                    useValue: options.persistence,
                },
                Reflector,
                ...ACCESS_POLICY_SERVICES,
            ],
            exports: [
                ACCESS_POLICY_MODULE_OPTIONS,
                ACCESS_POLICY_PERSISTENCE_ADAPTER,
                AccessPolicyFilterService,
                AccessPolicyInterceptor,
            ],
        };
    }
}

export { AccessPolicyModule };
