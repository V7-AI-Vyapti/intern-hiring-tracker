import type {
    AuthUserPrincipal,
    StaffUserRecord,
} from '../types/auth.types.js';

type UserResponse = {
    id: string;
    email: string;
    display_name: string | null;
};

type StaffUserResponse = {
    id: string;
    email: string;
    display_name: string | null;
    is_active: boolean;
    role_id: number | null;
};

function serializeUser(principal: AuthUserPrincipal): UserResponse {
    return {
        id: principal.id,
        email: principal.email,
        display_name: principal.displayName,
    };
}

function serializeStaffUser(user: StaffUserRecord): StaffUserResponse {
    return {
        id: String(user.id),
        email: user.email,
        display_name: user.displayName,
        is_active: user.isActive,
        role_id: user.roleId,
    };
}

type CreatedStaffUserResponse = StaffUserResponse & {
    reset_token: string | null;
};

type ResetTokenResponse = {
    reset_token: string;
};

function serializeStaffUsers(users: StaffUserRecord[]): StaffUserResponse[] {
    return users.map(serializeStaffUser);
}

function serializeCreatedStaffUser(args: {
    user: StaffUserRecord;
    resetToken: string | null;
}): CreatedStaffUserResponse {
    return {
        ...serializeStaffUser(args.user),
        reset_token: args.resetToken,
    };
}

function serializeResetToken(resetToken: string): ResetTokenResponse {
    return { reset_token: resetToken };
}

export {
    serializeCreatedStaffUser,
    serializeResetToken,
    serializeStaffUser,
    serializeStaffUsers,
    serializeUser,
};
export type {
    CreatedStaffUserResponse,
    ResetTokenResponse,
    StaffUserResponse,
    UserResponse,
};
