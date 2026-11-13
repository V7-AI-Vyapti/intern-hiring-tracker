import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
    AccessPolicyModule,
    type AccessPolicyRequest,
} from '@vyapti/access-policy';
import { GENERATED_ACCESS_POLICY_CONFIG } from './access-policy.config';
import { GeneratedAccessPolicyAdminGuard } from './guards/generated-access-policy-admin.guard';
import { createGeneratedAccessPolicyPersistenceAdapter } from './persistence/generated-access-policy-persistence.adapter';
import { GeneratedAccessPolicyBootstrapService } from './services/generated-access-policy-bootstrap.service';

const generatedAccessPolicyModule = AccessPolicyModule.forRoot({
    routePrefix: GENERATED_ACCESS_POLICY_CONFIG.ROUTE_PREFIX,
    forbiddenAs: GENERATED_ACCESS_POLICY_CONFIG.FORBIDDEN_AS,
    adminApi: GENERATED_ACCESS_POLICY_CONFIG.ADMIN_API,
    persistence: createGeneratedAccessPolicyPersistenceAdapter(),
    readIsSystemAdmin: readGeneratedIsSystemAdmin,
});

@Module({
    imports: [generatedAccessPolicyModule],
    exports: [generatedAccessPolicyModule],
    providers: [
        GeneratedAccessPolicyBootstrapService,
        GeneratedAccessPolicyAdminGuard,
        {
            provide: APP_GUARD,
            useExisting: GeneratedAccessPolicyAdminGuard,
        },
    ],
})
class GeneratedAccessPolicyModule {}

function readGeneratedIsSystemAdmin(request: AccessPolicyRequest): boolean {
    return request.user?.isSystemAdmin === true;
}

export { GeneratedAccessPolicyModule };
