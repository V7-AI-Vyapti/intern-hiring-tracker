import { Injectable } from '@nestjs/common';
import type { RbacContext, SessionAccess } from '../types/rbac.types.js';
import { EffectiveGrantsService } from './effective-grants.service.js';

@Injectable()
class SessionService {
    constructor(private readonly effectiveGrants: EffectiveGrantsService) {}

    async get(args: {
        userId: string;
        context?: RbacContext;
    }): Promise<SessionAccess> {
        return this.effectiveGrants.forUser(args);
    }
}

export { SessionService };
