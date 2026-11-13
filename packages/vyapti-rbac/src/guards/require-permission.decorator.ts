import { SetMetadata } from '@nestjs/common';
import type { Grant } from '../types/rbac.types.js';

const REQUIRED_PERMISSION_KEY = 'vyapti:required-permission';

function RequirePermission(resource: string, action: string): MethodDecorator {
    const grant: Grant = { resource, action };
    return SetMetadata(REQUIRED_PERMISSION_KEY, grant);
}

export { REQUIRED_PERMISSION_KEY, RequirePermission };
