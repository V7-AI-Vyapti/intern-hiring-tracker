import { Module } from '@nestjs/common';
import { RbacModule } from '@vyapti/rbac';
import { GENERATED_RBAC_CONFIG } from './rbac.config';
import { createGeneratedRbacPersistenceAdapter } from './persistence/generated-rbac-persistence.adapter';
import { GeneratedRbacBootstrapService } from './services/generated-rbac-bootstrap.service';

@Module({
    imports: [
        RbacModule.forRoot({
            routePrefix: GENERATED_RBAC_CONFIG.ROUTE_PREFIX,
            forbiddenAs: GENERATED_RBAC_CONFIG.FORBIDDEN_AS,
            adminApi: GENERATED_RBAC_CONFIG.ADMIN_API,
            persistence: createGeneratedRbacPersistenceAdapter(),
        }),
    ],
    providers: [GeneratedRbacBootstrapService],
})
class GeneratedRbacModule {}

export { GeneratedRbacModule };
