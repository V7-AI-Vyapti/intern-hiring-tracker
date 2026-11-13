import type { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { GENERATED_HIRING_ENTITY_NAMES } from '../hiring.constants';

type ResolveHiringRoles = (args: {
    userId: string;
    email: string;
}) => Promise<string[]>;

let boundResolveHiringRoles: ResolveHiringRoles | undefined;

/**
 * Resolve RBAC role name(s) for an authenticated user via user.role_id.
 * Used as HiringModule.forRoot({ resolveRoles }) when auth does not attach roles.
 */
const createHiringResolveRoles = (dataSource: DataSource): ResolveHiringRoles => {
    return async (args) => {
        const userEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.USER,
            dataSource,
        );
        const roleEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.ROLE,
            dataSource,
        );

        const userIdNumber = Number(args.userId);
        const user =
            Number.isFinite(userIdNumber) && userIdNumber > 0
                ? await userEntity.getByPk(userIdNumber)
                : await userEntity.one({ email: args.email });
        if (!user || typeof user !== 'object') {
            return [];
        }

        const roleRef = (user as Record<string, unknown>).role_id;
        let roleId: number | null = null;
        if (typeof roleRef === 'number') {
            roleId = roleRef;
        } else if (roleRef && typeof roleRef === 'object') {
            const nested = (roleRef as Record<string, unknown>).role_id;
            if (typeof nested === 'number') {
                roleId = nested;
            }
        } else if (typeof roleRef === 'string' && /^\d+$/.test(roleRef)) {
            roleId = Number(roleRef);
        }
        if (roleId == null) {
            return [];
        }

        const role = await roleEntity.getByPk(roleId);
        if (!role || typeof role !== 'object') {
            return [];
        }
        const name = (role as Record<string, unknown>).name;
        return typeof name === 'string' && name.length > 0 ? [name] : [];
    };
};

const bindHiringResolveRoles = (dataSource: DataSource): void => {
    boundResolveHiringRoles = createHiringResolveRoles(dataSource);
};

const resolveHiringRoles: ResolveHiringRoles = async (args) => {
    if (!boundResolveHiringRoles) {
        throw new Error(
            'Hiring role resolver is not bound. Ensure GeneratedHiringBootstrapService is registered.',
        );
    }
    return boundResolveHiringRoles(args);
};

export {
    bindHiringResolveRoles,
    createHiringResolveRoles,
    resolveHiringRoles,
};
