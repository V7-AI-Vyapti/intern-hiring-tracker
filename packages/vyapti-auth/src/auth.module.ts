import {
    DynamicModule,
    Module,
    type Provider,
    type Type,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ApiKeysController } from './controller/api-keys.controller.js';
import { MeController } from './controller/me.controller.js';
import { SessionController } from './controller/session.controller.js';
import { UsersController } from './controller/users.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { ApiKeyService } from './services/api-key.service.js';
import { AuthSessionService } from './services/auth-session.service.js';
import { JwtTokenService } from './services/jwt-token.service.js';
import { PasswordService } from './services/password.service.js';
import { RefreshCookieService } from './services/refresh-cookie.service.js';
import { RefreshTokenService } from './services/refresh-token.service.js';
import { UsersService } from './services/users.service.js';
import {
    AUTH_MODULE_OPTIONS,
    AUTH_PERSISTENCE_ADAPTER,
} from './auth.tokens.js';
import type {
    AuthModuleAsyncOptions,
    AuthModuleRootOptions,
} from './types/auth.types.js';
import { applyControllerPath } from './utils/apply-controller-path.util.js';
import { normalizeRoutePrefix } from './utils/normalize-route-prefix.util.js';
import { resolveAuthModuleOptions } from './utils/resolve-auth-module-options.util.js';

const AUTH_ROOT_OPTIONS = Symbol('AUTH_ROOT_OPTIONS');

const AUTH_HTTP_CONTROLLERS: Array<Type<unknown>> = [
    SessionController,
    MeController,
    ApiKeysController,
    UsersController,
];

@Module({})
class AuthModule {
    static forRoot(options: AuthModuleRootOptions): DynamicModule {
        const resolved = resolveAuthModuleOptions(options);
        return this.buildModule({
            optionsProvider: {
                provide: AUTH_MODULE_OPTIONS,
                useValue: resolved,
            },
            persistenceProvider: {
                provide: AUTH_PERSISTENCE_ADAPTER,
                useValue: options.persistence,
            },
            routePrefix: resolved.routePrefix,
            globalGuard: resolved.globalGuard,
        });
    }

    static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
        const inject = options.inject ?? [];
        return this.buildModule({
            extraImports: options.imports,
            optionsProvider: {
                provide: AUTH_MODULE_OPTIONS,
                inject: [AUTH_ROOT_OPTIONS],
                useFactory: (rootOptions: AuthModuleRootOptions) =>
                    resolveAuthModuleOptions({
                        ...rootOptions,
                        routePrefix: options.routePrefix,
                    }),
            },
            persistenceProvider: {
                provide: AUTH_PERSISTENCE_ADAPTER,
                inject: [AUTH_ROOT_OPTIONS],
                useFactory: (rootOptions: AuthModuleRootOptions) =>
                    rootOptions.persistence,
            },
            extraProviders: [
                {
                    provide: AUTH_ROOT_OPTIONS,
                    inject,
                    useFactory: options.useFactory,
                },
            ],
            routePrefix: normalizeRoutePrefix(options.routePrefix),
            globalGuard: options.globalGuard ?? true,
        });
    }

    private static buildModule(args: {
        optionsProvider: Provider;
        persistenceProvider: Provider;
        extraProviders?: Provider[];
        extraImports?: DynamicModule['imports'];
        routePrefix: string;
        globalGuard: boolean;
    }): DynamicModule {
        const providers: Provider[] = [
            ...(args.extraProviders ?? []),
            args.optionsProvider,
            args.persistenceProvider,
            PasswordService,
            JwtTokenService,
            RefreshTokenService,
            RefreshCookieService,
            ApiKeyService,
            AuthSessionService,
            UsersService,
            // Same module as AuthGuard so pnpm/Nest 11 does not look up
            // InternalCoreModule's Reflector (different @nestjs/core copy).
            Reflector,
            AuthGuard,
        ];

        if (args.globalGuard) {
            providers.push({
                provide: APP_GUARD,
                useExisting: AuthGuard,
            });
        }

        applyControllerPath({
            controllers: AUTH_HTTP_CONTROLLERS,
            path: args.routePrefix,
        });

        return {
            module: AuthModule,
            global: false,
            imports: [...(args.extraImports ?? [])],
            controllers: AUTH_HTTP_CONTROLLERS,
            providers,
            exports: [AUTH_MODULE_OPTIONS, AUTH_PERSISTENCE_ADAPTER, AuthGuard],
        };
    }
}

export { AuthModule };
