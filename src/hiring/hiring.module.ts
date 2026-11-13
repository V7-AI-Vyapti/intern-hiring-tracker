import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HiringModule } from '@vyapti/hiring';
import { GENERATED_HIRING_CONFIG } from './hiring.config';
import { GeneratedHiringAccessPolicyBypassGuard } from './guards/generated-hiring-access-policy-bypass.guard';
import { createGeneratedHiringPersistenceAdapter } from './persistence/generated-hiring-persistence.adapter';
import { GeneratedHiringBootstrapService } from './services/generated-hiring-bootstrap.service';
import { resolveHiringRoles } from './utils/resolve-hiring-roles.util';

/**
 * Host glue copied into a generated Intern Hiring Tracker app.
 * Bootstrap seeds RBAC + access-policy rows; bypass guard marks Recruiters
 * unrestricted for access-policy filters (existing isSystemAdmin flag).
 */
@Module({
    imports: [
        HiringModule.forRoot({
            routePrefix: GENERATED_HIRING_CONFIG.ROUTE_PREFIX,
            persistence: createGeneratedHiringPersistenceAdapter(),
            resolveRoles: resolveHiringRoles,
        }),
    ],
    providers: [
        GeneratedHiringBootstrapService,
        GeneratedHiringAccessPolicyBypassGuard,
        {
            provide: APP_GUARD,
            useExisting: GeneratedHiringAccessPolicyBypassGuard,
        },
    ],
})
class GeneratedHiringModule {}

export { GeneratedHiringModule };
