import { UnauthorizedException } from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import type { RbacPrincipal, RbacRequest } from '../types/rbac.types.js';

function requireRequestUser(request: RbacRequest): RbacPrincipal {
    if (!request.user) {
        throw new UnauthorizedException(RBAC_MESSAGES.UNAUTHORIZED);
    }
    return request.user;
}

export { requireRequestUser };
