import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { parsePositiveId } from '@auth/utils/parse-positive-id.util';
import { readBoolean } from '@vulcan/shared/utils/record-readers';
import { GENERATED_ACCESS_POLICY_ENTITY_NAMES } from '../access-policy.constants';
import { readNullableNumber } from '../utils/read-nullable-number.util';

type GeneratedAccessPolicyRequest = {
    user?: {
        id: string;
        isSystemAdmin?: boolean;
    };
};

@Injectable()
class GeneratedAccessPolicyAdminGuard implements CanActivate {
    private readonly logger = new Logger(GeneratedAccessPolicyAdminGuard.name);

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<GeneratedAccessPolicyRequest>();
        if (!request.user) {
            return true;
        }
        request.user.isSystemAdmin = await this.userIsSystemAdmin(
            request.user.id,
        );
        return true;
    }

    private async userIsSystemAdmin(userId: string): Promise<boolean> {
        const parsedUserId = parsePositiveId(userId);
        if (parsedUserId == null) {
            return false;
        }
        try {
            const user = await this.userEntity().getByPk(parsedUserId);
            const roleId = readNullableNumber(user, 'role_id');
            if (roleId == null) {
                return false;
            }
            const role = await this.roleEntity().getByPk(roleId);
            return role ? readBoolean(role, 'is_system') : false;
        } catch (error) {
            this.logger.warn(
                `Could not read system-admin flag for user ${parsedUserId}: ${String(error)}`,
            );
            return false;
        }
    }

    private userEntity() {
        return getEntityWithName(
            GENERATED_ACCESS_POLICY_ENTITY_NAMES.USER,
            this.dataSource,
        );
    }

    private roleEntity() {
        return getEntityWithName(
            GENERATED_ACCESS_POLICY_ENTITY_NAMES.ROLE,
            this.dataSource,
        );
    }
}

export { GeneratedAccessPolicyAdminGuard };
