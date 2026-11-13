import { ILike, IsNull } from 'typeorm';
import type {
    ApiKeyListRecord,
    AuthPersistenceAdapter,
    AuthUserRecord,
    CreateStaffUserArgs,
    ListApiKeysArgs,
    ListStaffUsersArgs,
    PasswordResetMatch,
    StaffUserRecord,
    StoredApiKey,
    StoredRefreshToken,
    UpdateStaffUserArgs,
} from '@vyapti/auth';
import {
    readForeignKeyId,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';
import { ApiKey } from '../entities/api_key.entity';
import { RefreshToken } from '../entities/refresh_token.entity';
import { User } from '../entities/user.entity';
import { ApiKeyCreateSchema } from '../schema/api-key-write.schema';
import { RefreshTokenCreateSchema } from '../schema/refresh-token-write.schema';
import {
    UserCreateSchema,
    UserUpdateSchema,
} from '../schema/user-write.schema';
import { fromIsoDateString, toIsoDateString } from '../utils/iso-date.util';
import {
    mapAuthUserRecord,
    mapStaffUserRecord,
} from '../utils/map-auth-user-record.util';
import { parsePositiveId } from '../utils/parse-positive-id.util';
import { readNullableString } from '../utils/read-nullable-string.util';

function requireUserId(userId: string): number {
    const parsed = parsePositiveId(userId);
    if (parsed == null) {
        throw new Error(`Invalid user id '${userId}'`);
    }
    return parsed;
}

function mapStoredRefreshToken(row: unknown): StoredRefreshToken {
    return {
        id: readNumber(row, 'refresh_token_id'),
        userId: readForeignKeyId(row, 'user_id', 'user_id'),
        hash: readString(row, 'token_hash'),
        expiresAt: fromIsoDateString(readString(row, 'expires_at')),
    };
}

function mapApiKeyListRecord(row: unknown): ApiKeyListRecord {
    return {
        id: readNumber(row, 'api_key_id'),
        prefix: readString(row, 'prefix'),
        name: readNullableString(row, 'name'),
        createdAt: fromIsoDateString(readString(row, 'created_at')),
    };
}

function mapStoredApiKey(row: unknown): StoredApiKey {
    const revokedAt = readNullableString(row, 'revoked_at');
    return {
        id: readNumber(row, 'api_key_id'),
        userId: readForeignKeyId(row, 'user_id', 'user_id'),
        prefix: readString(row, 'prefix'),
        hash: readString(row, 'token_hash'),
        name: readNullableString(row, 'name'),
        createdAt: fromIsoDateString(readString(row, 'created_at')),
        revokedAt: revokedAt ? fromIsoDateString(revokedAt) : null,
    };
}

function staffUserListWhere(search: string | null) {
    if (!search) {
        return {};
    }
    const term = ILike(`%${search}%`);
    return [{ email: term }, { display_name: term }];
}

function staffUserSortColumn(sortBy: ListStaffUsersArgs['sortBy']): string {
    if (sortBy === 'display_name') {
        return 'display_name';
    }
    return 'email';
}

function staffUserChanges(args: UpdateStaffUserArgs): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    if (args.roleId !== undefined) {
        changes.role_id = args.roleId;
    }
    if (args.isActive !== undefined) {
        changes.is_active = args.isActive;
    }
    if (args.passwordHash !== undefined) {
        changes.password_hash = args.passwordHash;
    }
    if (args.resetTokenHash !== undefined) {
        changes.password_reset_token_hash = args.resetTokenHash;
    }
    if (args.resetTokenExpiresAt !== undefined) {
        changes.password_reset_expires_at = args.resetTokenExpiresAt
            ? toIsoDateString(args.resetTokenExpiresAt)
            : null;
    }
    return changes;
}

function mapPasswordReset(row: unknown): PasswordResetMatch | null {
    const expiresAt = readNullableString(row, 'password_reset_expires_at');
    if (!expiresAt) {
        return null;
    }
    return {
        userId: String(readNumber(row, 'user_id')),
        expiresAt: fromIsoDateString(expiresAt),
    };
}

function createGeneratedAuthPersistenceAdapter(): AuthPersistenceAdapter {
    return {
        async listUsers(
            args: ListStaffUsersArgs,
        ): Promise<{ rows: StaffUserRecord[]; total: number }> {
            const where = staffUserListWhere(args.search);
            const [rows, total] = await Promise.all([
                User.filter(where, {
                    skip: args.skip,
                    take: args.take,
                    order: {
                        [staffUserSortColumn(args.sortBy)]: args.sortOrder,
                    },
                }),
                User.countOf(where),
            ]);
            return {
                rows: rows.map(mapStaffUserRecord),
                total,
            };
        },

        async findStaffUser(args: { userId: string }) {
            const userId = parsePositiveId(args.userId);
            if (userId == null) {
                return null;
            }
            const user = await User.getByPk(userId);
            return user ? mapStaffUserRecord(user) : null;
        },

        async createStaffUser(
            args: CreateStaffUserArgs,
        ): Promise<StaffUserRecord> {
            const payload = UserCreateSchema.parse({
                email: args.email,
                password_hash: args.passwordHash,
                display_name: args.displayName?.trim()
                    ? args.displayName.trim()
                    : null,
                is_active: true,
                role_id: args.roleId,
            });
            const created = await User.createOne(payload);
            return mapStaffUserRecord(created);
        },

        async updateStaffUser(args: UpdateStaffUserArgs) {
            const userId = parsePositiveId(args.userId);
            if (userId == null) {
                return null;
            }
            const existing = await User.getByPk(userId);
            if (!existing) {
                return null;
            }
            const payload = UserUpdateSchema.parse(staffUserChanges(args));
            await User.updateByPk(userId, payload);
            const updated = await User.getByPk(userId);
            return updated ? mapStaffUserRecord(updated) : null;
        },

        async findPasswordReset(args: {
            hash: string;
        }): Promise<PasswordResetMatch | null> {
            const row = await User.one({
                password_reset_token_hash: args.hash,
            });
            return row ? mapPasswordReset(row) : null;
        },

        async deleteRefreshTokensForUser(args: {
            userId: string;
        }): Promise<void> {
            const userId = parsePositiveId(args.userId);
            if (userId == null) {
                return;
            }
            await RefreshToken.deleteWhere({ user_id: userId });
        },

        async findUserByEmail(args: {
            email: string;
        }): Promise<AuthUserRecord | null> {
            const user = await User.one({ email: args.email.toLowerCase() });
            return user ? mapAuthUserRecord(user) : null;
        },

        async findUserById(args: {
            userId: string;
        }): Promise<AuthUserRecord | null> {
            const userId = parsePositiveId(args.userId);
            if (userId == null) {
                return null;
            }
            const user = await User.getByPk(userId);
            return user ? mapAuthUserRecord(user) : null;
        },

        async createUser(args: {
            email: string;
            passwordHash: string;
            displayName?: string;
        }): Promise<AuthUserRecord> {
            const payload = UserCreateSchema.parse({
                email: args.email,
                password_hash: args.passwordHash,
                display_name: args.displayName?.trim()
                    ? args.displayName.trim()
                    : null,
                is_active: true,
            });
            const created = await User.createOne(payload);
            return mapAuthUserRecord(created);
        },

        async updateUser(args: {
            userId: string;
            displayName?: string;
            email?: string;
        }): Promise<AuthUserRecord> {
            const userId = requireUserId(args.userId);
            const payload = UserUpdateSchema.parse({
                ...(args.email !== undefined ? { email: args.email } : {}),
                ...(args.displayName !== undefined
                    ? { display_name: args.displayName }
                    : {}),
            });
            await User.updateByPk(userId, payload);
            const updated = await User.getByPk(userId);
            if (!updated) {
                throw new Error('User was not found after update');
            }
            return mapAuthUserRecord(updated);
        },

        async saveRefreshToken(args: {
            userId: string;
            hash: string;
            expiresAt: Date;
        }): Promise<void> {
            const payload = RefreshTokenCreateSchema.parse({
                user_id: requireUserId(args.userId),
                token_hash: args.hash,
                expires_at: toIsoDateString(args.expiresAt),
            });
            await RefreshToken.createOne(payload);
        },

        async findRefreshTokenByHash(args: {
            hash: string;
        }): Promise<StoredRefreshToken | null> {
            const row = await RefreshToken.one(
                { token_hash: args.hash },
                { relations: { user_id: true } },
            );
            return row ? mapStoredRefreshToken(row) : null;
        },

        async deleteRefreshTokenByHash(args: { hash: string }): Promise<void> {
            await RefreshToken.deleteWhere({ token_hash: args.hash });
        },

        async createApiKey(args: {
            userId: string;
            name: string | null;
            prefix: string;
            hash: string;
        }): Promise<ApiKeyListRecord> {
            const payload = ApiKeyCreateSchema.parse({
                user_id: requireUserId(args.userId),
                prefix: args.prefix,
                token_hash: args.hash,
                name: args.name,
                created_at: toIsoDateString(new Date()),
                revoked_at: null,
            });
            const created = await ApiKey.createOne(payload);
            return mapApiKeyListRecord(created);
        },

        async listApiKeys(
            args: ListApiKeysArgs,
        ): Promise<{ rows: ApiKeyListRecord[]; total: number }> {
            const userId = requireUserId(args.userId);
            const where: Record<string, unknown> = {
                user_id: userId,
                revoked_at: IsNull(),
            };
            if (args.search) {
                where.name = ILike(`%${args.search}%`);
            }
            const sortColumn = args.sortBy === 'name' ? 'name' : 'created_at';
            const [rows, total] = await Promise.all([
                ApiKey.filter(where, {
                    skip: args.skip,
                    take: args.take,
                    order: { [sortColumn]: args.sortOrder },
                }),
                ApiKey.countOf(where),
            ]);
            return {
                rows: rows.map((row) => mapApiKeyListRecord(row)),
                total,
            };
        },

        async findApiKeyByPrefix(args: {
            prefix: string;
        }): Promise<StoredApiKey | null> {
            const row = await ApiKey.one({ prefix: args.prefix });
            return row ? mapStoredApiKey(row) : null;
        },

        async revokeApiKey(args: {
            userId: string;
            apiKeyId: string;
        }): Promise<boolean> {
            const userId = requireUserId(args.userId);
            const apiKeyId = parsePositiveId(args.apiKeyId);
            if (apiKeyId == null) {
                return false;
            }
            const row = await ApiKey.one({
                api_key_id: apiKeyId,
                user_id: userId,
            });
            if (!row || readNullableString(row, 'revoked_at')) {
                return false;
            }
            await ApiKey.updateByPk(apiKeyId, {
                revoked_at: toIsoDateString(new Date()),
            });
            return true;
        },
    };
}

export { createGeneratedAuthPersistenceAdapter };
