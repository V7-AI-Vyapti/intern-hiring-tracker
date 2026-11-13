import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import { PermissionCheckService } from '../services/permission-check.service.js';
import type { Grant, RbacRequest } from '../types/rbac.types.js';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator.js';

@Injectable()
class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly permissionCheckService: PermissionCheckService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const grant = this.reflector.getAllAndOverride<Grant | undefined>(
            REQUIRED_PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!grant) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RbacRequest>();
        if (!request.user) {
            throw new NotFoundException(RBAC_MESSAGES.ACCESS_DENIED);
        }

        const allowed = await this.permissionCheckService.isAllowed({
            userId: request.user.id,
            context: request.rbacContext,
            grant,
        });
        if (!allowed) {
            throw new NotFoundException(RBAC_MESSAGES.ACCESS_DENIED);
        }

        return true;
    }
}

export { PermissionsGuard };
