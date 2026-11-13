import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { GENERATED_HIRING_ENTITY_NAMES, GENERATED_HIRING_ROLES } from '../hiring.constants';

type HiringAccessPolicyRequest = {
    user?: {
        id: string;
        isSystemAdmin?: boolean;
    };
};

/**
 * Marks Recruiters as access-policy unrestricted via the existing
 * `request.user.isSystemAdmin` flag that `@vyapti/access-policy` already reads.
 *
 * Access-policy v1 only bypasses this flag (normally set from role.is_system).
 * Recruiter must see all hiring rows without inventing new filter operators.
 * Runs as an APP_GUARD alongside GeneratedAccessPolicyAdminGuard.
 */
@Injectable()
class GeneratedHiringAccessPolicyBypassGuard implements CanActivate {
    private readonly logger = new Logger(
        GeneratedHiringAccessPolicyBypassGuard.name,
    );

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<HiringAccessPolicyRequest>();
        if (!request.user) {
            return true;
        }
        if (request.user.isSystemAdmin === true) {
            return true;
        }
        try {
            if (await this.userIsUnrestrictedRecruiter(request.user.id)) {
                request.user.isSystemAdmin = true;
            }
        } catch (error) {
            this.logger.warn(
                `Could not resolve hiring access-policy bypass for user ${request.user.id}: ${String(error)}`,
            );
        }
        return true;
    }

    private async userIsUnrestrictedRecruiter(userId: string): Promise<boolean> {
        const parsed = Number(userId);
        if (!Number.isInteger(parsed) || parsed < 1) {
            return false;
        }
        const userEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.USER,
            this.dataSource,
        );
        const roleEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.ROLE,
            this.dataSource,
        );
        const user = await userEntity.getByPk(parsed);
        if (!user || typeof user !== 'object') {
            return false;
        }
        const roleRef = (user as Record<string, unknown>).role_id;
        let roleId: number | null = null;
        if (typeof roleRef === 'number') {
            roleId = roleRef;
        } else if (roleRef && typeof roleRef === 'object') {
            const nested = (roleRef as Record<string, unknown>).role_id;
            if (typeof nested === 'number') {
                roleId = nested;
            }
        }
        if (roleId == null) {
            return false;
        }
        const role = await roleEntity.getByPk(roleId);
        if (!role || typeof role !== 'object') {
            return false;
        }
        const name = (role as Record<string, unknown>).name;
        return name === GENERATED_HIRING_ROLES.RECRUITER || name === 'Admin';
    }
}

export { GeneratedHiringAccessPolicyBypassGuard };
