import { SetMetadata } from '@nestjs/common';

const ACCESS_POLICY_ENTITY_KEY = 'vyapti:access-policy-entity';

function AccessPolicyEntity(entityName: string): MethodDecorator {
    return SetMetadata(ACCESS_POLICY_ENTITY_KEY, entityName);
}

export { ACCESS_POLICY_ENTITY_KEY, AccessPolicyEntity };
