import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_MESSAGES } from '../auth.constants.js';
import { AUTH_MODULE_OPTIONS } from '../auth.tokens.js';
import { AuthSessionService } from '../services/auth-session.service.js';
import type {
    AuthUserPrincipal,
    ResolvedAuthModuleOptions,
} from '../types/auth.types.js';
import { hasApiKeyStrategy, hasJwtStrategy } from '../utils/auth-strategy.util.js';
import { parseBearerToken } from '../utils/parse-bearer-token.util.js';
import { isApiKeyShape, isJwtShape } from '../utils/token-shape.util.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

type AuthRequest = {
    headers: Record<string, string | string[] | undefined>;
    user?: AuthUserPrincipal;
};

@Injectable()
class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
        private readonly authSessionService: AuthSessionService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthRequest>();
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const bearerToken = parseBearerToken(request.headers.authorization);

        if (bearerToken) {
            request.user = await this.authenticateToken(bearerToken);
            return true;
        }

        if (isPublic) {
            return true;
        }

        throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    private async authenticateToken(token: string): Promise<AuthUserPrincipal> {
        if (isApiKeyShape(token) && hasApiKeyStrategy(this.options.strategies)) {
            return this.authSessionService.authenticateApiKey({ rawKey: token });
        }

        if (isJwtShape(token) && hasJwtStrategy(this.options.strategies)) {
            const principal = this.authSessionService.authenticateJwt({ token });
            return this.authSessionService.hydratePrincipal(principal);
        }

        throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
    }
}

export { AuthGuard };
export type { AuthRequest };
