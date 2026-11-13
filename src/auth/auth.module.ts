import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
    AUTH_REGISTER_POLICIES,
    AUTH_STRATEGIES,
    AuthModule,
    PasswordService,
} from '@vyapti/auth';
import { GENERATED_AUTH_CONFIG } from './auth.config';
import { GeneratedHttpAuthGuard } from './guards/generated-http-auth.guard';
import { createGeneratedAuthPersistenceAdapter } from './persistence/generated-auth-persistence.adapter';
import { GeneratedAuthBootstrapService } from './services/generated-auth-bootstrap.service';
import { normalizePemEnv } from './utils/normalize-pem-env.util';
import { resolveAuthCookiePath } from './utils/resolve-auth-cookie-path.util';

@Module({
    imports: [
        AuthModule.forRootAsync({
            routePrefix: GENERATED_AUTH_CONFIG.ROUTE_PREFIX,
            globalGuard: false,
            useFactory: () => {
                normalizePemEnv(GENERATED_AUTH_CONFIG.JWT_PRIVATE_KEY_ENV);
                normalizePemEnv(GENERATED_AUTH_CONFIG.JWT_PUBLIC_KEY_ENV);
                return {
                    routePrefix: GENERATED_AUTH_CONFIG.ROUTE_PREFIX,
                    jwt: {
                        privateKeyEnv: GENERATED_AUTH_CONFIG.JWT_PRIVATE_KEY_ENV,
                        publicKeyEnv: GENERATED_AUTH_CONFIG.JWT_PUBLIC_KEY_ENV,
                        accessTtl: GENERATED_AUTH_CONFIG.ACCESS_TTL,
                        refreshTtl: GENERATED_AUTH_CONFIG.REFRESH_TTL,
                    },
                    strategies: [AUTH_STRATEGIES.JWT, AUTH_STRATEGIES.API_KEY],
                    registerPolicy: AUTH_REGISTER_POLICIES.ADMIN_CREATES,
                    globalGuard: false,
                    cookie: {
                        path: resolveAuthCookiePath(),
                    },
                    persistence: createGeneratedAuthPersistenceAdapter(),
                };
            },
        }),
    ],
    providers: [
        PasswordService,
        GeneratedAuthBootstrapService,
        GeneratedHttpAuthGuard,
        {
            provide: APP_GUARD,
            useExisting: GeneratedHttpAuthGuard,
        },
    ],
})
class GeneratedAuthModule {}

export { GeneratedAuthModule };
