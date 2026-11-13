import { ApiBearerAuth } from '@nestjs/swagger';
import { AUTH_SWAGGER } from '../auth.constants.js';

const AUTH_BEARER_DECORATORS = [ApiBearerAuth(AUTH_SWAGGER.BEARER_SCHEME)];

export { AUTH_BEARER_DECORATORS };
