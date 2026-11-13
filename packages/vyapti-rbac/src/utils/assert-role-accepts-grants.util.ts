import { BadRequestException } from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import type { RoleRecord } from '../types/rbac.types.js';

function assertRoleAcceptsGrants(role: RoleRecord): void {
    if (role.fullAccess) {
        throw new BadRequestException(
            RBAC_MESSAGES.FULL_ACCESS_GRANTS_FORBIDDEN,
        );
    }
}

export { assertRoleAcceptsGrants };
