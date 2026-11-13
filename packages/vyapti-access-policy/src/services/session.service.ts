import { Inject, Injectable } from '@nestjs/common';
import { ACCESS_POLICY_PERSISTENCE_ADAPTER } from '../access-policy.tokens.js';
import type {
    AccessPolicyPersistenceAdapter,
    CallerScopes,
} from '../types/access-policy.types.js';
import { groupScopeIds } from '../utils/policy-shape.util.js';

@Injectable()
class SessionService {
    constructor(
        @Inject(ACCESS_POLICY_PERSISTENCE_ADAPTER)
        private readonly persistence: AccessPolicyPersistenceAdapter,
    ) {}

    async get(args: {
        userId: string;
        isSystemAdmin: boolean;
    }): Promise<CallerScopes> {
        if (args.isSystemAdmin) {
            return { unrestricted: true, scopes: {} };
        }
        const memberships = await this.persistence.listMemberships({
            userId: args.userId,
        });
        return {
            unrestricted: false,
            scopes: groupScopeIds(memberships.rows),
        };
    }
}

export { SessionService };
