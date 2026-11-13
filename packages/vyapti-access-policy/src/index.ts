import { AccessPolicyEntity } from './decorators/access-policy-entity.decorator.js';
import { AccessPolicyInterceptor } from './interceptors/access-policy.interceptor.js';
import { AccessPolicyModule } from './access-policy.module.js';
import { AccessPolicyFilterService } from './services/access-policy-filter.service.js';
import {
    applyAccessFilter,
    assertUpdateScope,
    prepareCreateBody,
    type AccessFilterClause,
} from './utils/apply-access-filter.util.js';
import { requireRequestUser } from './utils/require-request-user.util.js';
import type {
    AccessFilter,
    AccessPolicyMode,
    AccessPolicyModuleRootOptions,
    AccessPolicyPersistenceAdapter,
    AccessPolicyRequest,
    CallerScopes,
    MembershipListArgs,
    MembershipRecord,
    MembershipWriteInput,
    PolicyListArgs,
    PolicyRecord,
    PolicyUpdateInput,
    PolicyWriteInput,
} from './types/access-policy.types.js';

export {
    AccessPolicyEntity,
    AccessPolicyFilterService,
    AccessPolicyInterceptor,
    AccessPolicyModule,
    applyAccessFilter,
    assertUpdateScope,
    prepareCreateBody,
    requireRequestUser,
};
export type {
    AccessFilterClause,
    AccessFilter,
    AccessPolicyMode,
    AccessPolicyModuleRootOptions,
    AccessPolicyPersistenceAdapter,
    AccessPolicyRequest,
    CallerScopes,
    MembershipListArgs,
    MembershipRecord,
    MembershipWriteInput,
    PolicyListArgs,
    PolicyRecord,
    PolicyUpdateInput,
    PolicyWriteInput,
};
