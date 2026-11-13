import { Injectable, NotFoundException } from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import type { RbacContext } from '../types/rbac.types.js';
import { PermissionCheckService } from './permission-check.service.js';

@Injectable()
class AssertPermissionService {
    constructor(
        private readonly permissionCheckService: PermissionCheckService,
    ) {}

    async assertPermission(args: {
        userId: string;
        resource: string;
        action: string;
        context?: RbacContext;
    }): Promise<void> {
        const allowed = await this.permissionCheckService.isAllowed({
            userId: args.userId,
            context: args.context,
            grant: { resource: args.resource, action: args.action },
        });
        if (!allowed) {
            throw new NotFoundException(RBAC_MESSAGES.ACCESS_DENIED);
        }
    }
}

export { AssertPermissionService };
