import { buildEntitySchema } from '@vyapti/core';
import { AccessPolicy } from './access_policy.entity';
import { AccessPolicyMembership } from './access_policy_membership.entity';

const entitySchemas = [
    buildEntitySchema(AccessPolicy),
    buildEntitySchema(AccessPolicyMembership),
];

export { AccessPolicy, AccessPolicyMembership, entitySchemas };
