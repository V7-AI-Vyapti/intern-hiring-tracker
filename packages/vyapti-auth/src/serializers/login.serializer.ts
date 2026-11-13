import type { SessionTokens } from '../services/auth-session.service.js';
import { serializeUser, type UserResponse } from './user.serializer.js';

type LoginResponse = {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    user: UserResponse;
};

function serializeLogin(session: SessionTokens): LoginResponse {
    return {
        access_token: session.accessToken,
        token_type: 'Bearer',
        expires_in: session.expiresIn,
        user: serializeUser(session.user),
    };
}

export { serializeLogin };
export type { LoginResponse };
