import { randomBytes, randomInt } from 'node:crypto';
import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import {
    AUTH_LIST_DEFAULTS,
    AUTH_MESSAGES,
    AUTH_PASSWORD_RESET,
    AUTH_USER_LIST_DEFAULTS,
} from '../auth.constants.js';
import { AUTH_PERSISTENCE_ADAPTER } from '../auth.tokens.js';
import type {
    AuthPersistenceAdapter,
    StaffUserListSortBy,
    StaffUserRecord,
} from '../types/auth.types.js';
import { hashToken } from '../utils/hash-token.util.js';
import { PasswordService } from './password.service.js';

type ListUsersResult = {
    rows: StaffUserRecord[];
    total: number;
    page: number;
    limit: number;
};

type CreatedStaffUser = {
    user: StaffUserRecord;
    resetToken: string | null;
};

@Injectable()
class UsersService {
    constructor(
        @Inject(AUTH_PERSISTENCE_ADAPTER)
        private readonly persistence: AuthPersistenceAdapter,
        private readonly passwordService: PasswordService,
    ) {}

    async list(args: {
        page?: number;
        limit?: number;
        search?: string | null;
        sortBy?: StaffUserListSortBy;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<ListUsersResult> {
        const page = args.page ?? AUTH_LIST_DEFAULTS.PAGE;
        const limit = Math.min(
            args.limit ?? AUTH_LIST_DEFAULTS.LIMIT,
            AUTH_LIST_DEFAULTS.MAX_LIMIT,
        );
        const result = await this.persistence.listUsers({
            search: args.search?.trim() ? args.search.trim() : null,
            skip: (page - 1) * limit,
            take: limit,
            sortBy: args.sortBy ?? AUTH_USER_LIST_DEFAULTS.SORT_BY,
            sortOrder: args.sortOrder ?? AUTH_USER_LIST_DEFAULTS.SORT_ORDER,
        });

        return {
            rows: result.rows,
            total: result.total,
            page,
            limit,
        };
    }

    async get(args: { userId: string }): Promise<StaffUserRecord> {
        return this.requireStaffUser(args.userId);
    }

    async create(args: {
        email: string;
        displayName?: string;
        roleId: number;
        password?: string;
        otp?: boolean;
    }): Promise<CreatedStaffUser> {
        const existing = await this.persistence.findUserByEmail({
            email: args.email,
        });
        if (existing) {
            throw new ConflictException(AUTH_MESSAGES.EMAIL_TAKEN);
        }

        const user = await this.persistence.createStaffUser({
            email: args.email,
            displayName: displayNameOrNull(args.displayName),
            roleId: args.roleId,
            passwordHash: await this.passwordService.hashPassword({
                password: args.password ?? randomBytes(32).toString('hex'),
            }),
        });
        if (args.password) {
            return { user, resetToken: null };
        }

        const resetToken = await this.issuePasswordReset({
            userId: String(user.id),
            otp: args.otp === true,
            replacePassword: false,
        });
        return { user, resetToken };
    }

    async update(args: {
        userId: string;
        roleId?: number | null;
        isActive?: boolean;
    }): Promise<StaffUserRecord> {
        const user = await this.persistence.updateStaffUser({
            userId: args.userId,
            roleId: args.roleId,
            isActive: args.isActive,
        });
        if (!user) {
            throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
        }
        if (args.isActive === false) {
            await this.persistence.deleteRefreshTokensForUser({
                userId: args.userId,
            });
        }
        return user;
    }

    async forcePasswordReset(args: {
        userId: string;
        otp?: boolean;
    }): Promise<string> {
        await this.requireStaffUser(args.userId);
        const resetToken = await this.issuePasswordReset({
            userId: args.userId,
            otp: args.otp === true,
            replacePassword: true,
        });
        await this.persistence.deleteRefreshTokensForUser({
            userId: args.userId,
        });
        return resetToken;
    }

    async resetPassword(args: {
        token: string;
        password: string;
    }): Promise<void> {
        const match = await this.persistence.findPasswordReset({
            hash: hashToken({ token: args.token }),
        });
        if (!match || match.expiresAt.getTime() <= Date.now()) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }

        const updated = await this.persistence.updateStaffUser({
            userId: match.userId,
            passwordHash: await this.passwordService.hashPassword({
                password: args.password,
            }),
            resetTokenHash: null,
            resetTokenExpiresAt: null,
        });
        if (!updated) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
        }
        await this.persistence.deleteRefreshTokensForUser({
            userId: match.userId,
        });
    }

    private async requireStaffUser(userId: string): Promise<StaffUserRecord> {
        const user = await this.persistence.findStaffUser({ userId });
        if (!user) {
            throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
        }
        return user;
    }

    private async issuePasswordReset(args: {
        userId: string;
        otp: boolean;
        replacePassword: boolean;
    }): Promise<string> {
        const resetToken = createResetSecret(args.otp);
        const passwordHash = args.replacePassword
            ? await this.passwordService.hashPassword({
                  password: randomBytes(32).toString('hex'),
              })
            : undefined;
        const updated = await this.persistence.updateStaffUser({
            userId: args.userId,
            passwordHash,
            resetTokenHash: hashToken({ token: resetToken }),
            resetTokenExpiresAt: new Date(
                Date.now() + AUTH_PASSWORD_RESET.TTL_MS,
            ),
        });
        if (!updated) {
            throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
        }
        return resetToken;
    }
}

function displayNameOrNull(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed;
}

function createResetSecret(otp: boolean): string {
    if (!otp) {
        return randomBytes(32).toString('hex');
    }
    return randomInt(0, 1_000_000)
        .toString()
        .padStart(AUTH_PASSWORD_RESET.OTP_LENGTH, '0');
}

export { UsersService };
export type { CreatedStaffUser, ListUsersResult };
