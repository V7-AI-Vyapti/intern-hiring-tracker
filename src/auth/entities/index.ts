import { buildEntitySchema } from '@vyapti/core';
import { ApiKey } from './api_key.entity';
import { RefreshToken } from './refresh_token.entity';
import { User } from './user.entity';

export const entitySchemas = [
    buildEntitySchema(ApiKey),
    buildEntitySchema(RefreshToken),
    buildEntitySchema(User),
];
