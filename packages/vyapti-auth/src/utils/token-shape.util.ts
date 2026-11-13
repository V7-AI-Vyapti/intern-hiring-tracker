import { AUTH_API_KEY } from '../auth.constants.js';

const JWT_SEGMENT_COUNT = 3;

function isJwtShape(token: string): boolean {
    return token.split('.').length === JWT_SEGMENT_COUNT && !isApiKeyShape(token);
}

function isApiKeyShape(token: string): boolean {
    return token.startsWith(`${AUTH_API_KEY.PREFIX}_`);
}

export { isApiKeyShape, isJwtShape };
