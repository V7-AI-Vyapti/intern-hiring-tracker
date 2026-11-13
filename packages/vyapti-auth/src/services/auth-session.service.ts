import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AUTH_MESSAGES, AUTH_REGISTER_POLICIES } from '../auth.constants.js';
import {
    AUTH_MODULE_OPTIONS,
    AUTH_PERSISTENCE_ADAPTER,
} from '../auth.tokens.js';
import type {
    AuthPersistenceAdapter,
    AuthUserPrincipal,
    AuthUserRecord,
    ResolvedAuthModuleOptions,
} from '../types/auth.types.js';
import { ApiKeyService } from './api-key.service.js';
import { JwtTokenService } from './jwt-token.service.js';
import { PasswordService } from './password.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

type SessionTokens = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUserPrincipal;
};

@Injectable()
class AuthSessionService {
    constructor(
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
        @Inject(AUTH_PERSISTENCE_ADAPTER)
        private readonly persistence: AuthPersistenceAdapter,
        private readonly passwordService: PasswordService,
        private readonly jwtTokenService: JwtTokenService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly apiKeyService: ApiKeyService,
    ) {}

    async login(args: {
        email: string;
        password: string;
    }): Promise<SessionTokens> {
        const user = await this.persistence.findUserByEmail({
            email: args.email,
        });
        if (!user) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        this.assertActiveUser(user);
        const passwordMatches = await this.passwordService.passwordMatches({
            password: args.password,
            passwordHash: user.passwordHash,
        });
        if (!passwordMatches) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        return this.issueSession(user);
    }

    async register(args: {
        email: string;
        password: string;
        displayName?: string;
        actor: AuthUserPrincipal | null;
    }): Promise<SessionTokens> {
        this.assertRegistrationAllowed(args.actor);
        const existing = await this.persistence.findUserByEmail({
            email: args.email,
        });
        if (existing) {
            throw new ConflictException(AUTH_MESSAGES.EMAIL_TAKEN);
        }

        const passwordHash = await this.passwordService.hashPassword({
            password: args.password,
        });
        const user = await this.persistence.createUser({
            email: args.email,
            passwordHash,
            displayName: args.displayName,
        });
        return this.issueSession(user);
    }

    async refresh(args: {
        refreshToken: string | null;
    }): Promise<SessionTokens> {
        if (!args.refreshToken) {
            throw new UnauthorizedException(
                AUTH_MESSAGES.REFRESH_TOKEN_INVALID,
            );
        }

        let stored;
        try {
            stored = await this.refreshTokenService.consume({
                rawToken: args.refreshToken,
            });
        } catch {
            throw new UnauthorizedException(
                AUTH_MESSAGES.REFRESH_TOKEN_INVALID,
            );
        }

        const user = await this.persistence.findUserById({
            userId: String(stored.userId),
        });
        if (!user) {
            throw new UnauthorizedException(
                AUTH_MESSAGES.REFRESH_TOKEN_INVALID,
            );
        }
        this.assertActiveUser(user);
        return this.issueSession(user);
    }

    async logout(args: { refreshToken: string | null }): Promise<void> {
        if (!args.refreshToken) {
            return;
        }
        await this.refreshTokenService.revoke({ rawToken: args.refreshToken });
    }

    async getMe(args: { userId: string }): Promise<AuthUserPrincipal> {
        const user = await this.requireUser({ userId: args.userId });
        return this.toPrincipal(user, 'jwt');
    }

    async patchMe(args: {
        userId: string;
        displayName?: string;
        email?: string;
    }): Promise<AuthUserPrincipal> {
        await this.requireUser({ userId: args.userId });
        const updated = await this.persistence.updateUser({
            userId: args.userId,
            displayName: args.displayName,
            email: args.email,
        });
        return this.toPrincipal(updated, 'jwt');
    }

    authenticateJwt(args: { token: string }): AuthUserPrincipal {
        try {
            return this.jwtTokenService.verifyAccessToken(args);
        } catch {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }
    }

    authenticateApiKey(args: { rawKey: string }): Promise<AuthUserPrincipal> {
        return this.apiKeyService.authenticate(args);
    }

    async hydratePrincipal(
        principal: AuthUserPrincipal,
    ): Promise<AuthUserPrincipal> {
        const user = await this.persistence.findUserById({
            userId: principal.id,
        });
        if (!user || !user.isActive) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }
        return {
            ...this.toPrincipal(user, principal.authMethod),
        };
    }

    private async issueSession(user: AuthUserRecord): Promise<SessionTokens> {
        const userId = String(user.id);
        const accessToken = this.jwtTokenService.signAccessToken({
            userId,
            email: user.email,
        });
        const refreshToken = await this.refreshTokenService.issue({ userId });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.options.jwt.accessTtlSeconds,
            user: this.toPrincipal(user, 'jwt'),
        };
    }

    private async requireUser(args: {
        userId: string;
    }): Promise<AuthUserRecord> {
        const user = await this.persistence.findUserById(args);
        if (!user) {
            throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
        }
        this.assertActiveUser(user);
        return user;
    }

    private assertActiveUser(user: AuthUserRecord): void {
        if (!user.isActive) {
            throw new UnauthorizedException(AUTH_MESSAGES.ACCOUNT_DISABLED);
        }
    }

    private assertRegistrationAllowed(actor: AuthUserPrincipal | null): void {
        if (
            this.options.registerPolicy === AUTH_REGISTER_POLICIES.INVITE_ONLY
        ) {
            throw new NotFoundException(AUTH_MESSAGES.REGISTER_DISABLED);
        }
        if (
            this.options.registerPolicy ===
                AUTH_REGISTER_POLICIES.ADMIN_CREATES &&
            !actor
        ) {
            throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
        }
    }

    private toPrincipal(
        user: AuthUserRecord,
        authMethod: AuthUserPrincipal['authMethod'],
    ): AuthUserPrincipal {
        return {
            id: String(user.id),
            email: user.email,
            displayName: user.displayName,
            authMethod,
        };
    }
}

export { AuthSessionService };
export type { SessionTokens };
