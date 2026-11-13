import { UnauthorizedException } from '@nestjs/common';
import { ACCESS_POLICY_MESSAGES } from '../access-policy.constants.js';
import type {
    AccessPolicyPrincipal,
    AccessPolicyRequest,
} from '../types/access-policy.types.js';

function requireRequestUser(
    request: AccessPolicyRequest,
): AccessPolicyPrincipal {
    if (!request.user) {
        throw new UnauthorizedException(ACCESS_POLICY_MESSAGES.UNAUTHORIZED);
    }
    return request.user;
}

export { requireRequestUser };
