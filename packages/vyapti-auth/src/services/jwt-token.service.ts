import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AUTH_MODULE_OPTIONS } from '../auth.tokens.js';
import type {
    AuthUserPrincipal,
    ResolvedAuthModuleOptions,
} from '../types/auth.types.js';

type JwtPayload = {
    sub: string;
    email: string;
};

@Injectable()
class JwtTokenService {
    constructor(
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
    ) {}

    signAccessToken(args: { userId: string; email: string }): string {
        return jwt.sign(
            { sub: args.userId, email: args.email } satisfies JwtPayload,
            this.options.jwt.privateKey,
            {
                algorithm: 'RS256',
                expiresIn: this.options.jwt.accessTtlSeconds,
            },
        );
    }

    verifyAccessToken(args: { token: string }): AuthUserPrincipal {
        const payload = jwt.verify(args.token, this.options.jwt.publicKey, {
            algorithms: ['RS256'],
        }) as JwtPayload;

        return {
            id: String(payload.sub),
            email: payload.email,
            displayName: null,
            authMethod: 'jwt',
        };
    }
}

export { JwtTokenService };
