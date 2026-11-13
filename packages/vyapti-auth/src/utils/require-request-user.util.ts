import { UnauthorizedException } from '@nestjs/common';
import { AUTH_MESSAGES } from '../auth.constants.js';
import type { AuthRequest } from '../guards/auth.guard.js';
import type { AuthUserPrincipal } from '../types/auth.types.js';

function requireRequestUser(request: AuthRequest): AuthUserPrincipal {
    if (!request.user) {
        throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }
    return request.user;
}

export { requireRequestUser };
