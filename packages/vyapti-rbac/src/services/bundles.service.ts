import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import { RBAC_PERSISTENCE_ADAPTER } from '../rbac.tokens.js';
import type {
    BundleDetail,
    BundleRecord,
    Grant,
    RbacPersistenceAdapter,
} from '../types/rbac.types.js';
import {
    blankToNull,
    optionalHint,
    resolveLabel,
} from '../utils/resolve-label.util.js';
import { CatalogGrantsService } from './catalog-grants.service.js';
import { PermissionCacheService } from './permission-cache.service.js';

type NameSortedPage = {
    page: number;
    limit: number;
    search: string | null;
    sortBy: 'name';
    sortOrder: 'ASC' | 'DESC';
};

@Injectable()
class BundlesService {
    constructor(
        @Inject(RBAC_PERSISTENCE_ADAPTER)
        private readonly persistence: RbacPersistenceAdapter,
        private readonly catalogGrants: CatalogGrantsService,
        private readonly cache: PermissionCacheService,
    ) {}

    async list(args: NameSortedPage): Promise<{
        rows: BundleRecord[];
        total: number;
        page: number;
        limit: number;
    }> {
        const result = await this.persistence.listBundles({
            search: args.search,
            skip: (args.page - 1) * args.limit,
            take: args.limit,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
        });
        return { ...result, page: args.page, limit: args.limit };
    }

    async create(args: {
        name: string;
        label?: string | null;
        hint?: string | null;
    }): Promise<BundleRecord> {
        const existing = await this.persistence.findBundleByName({
            name: args.name,
        });
        if (existing) {
            throw new ConflictException(RBAC_MESSAGES.BUNDLE_NAME_TAKEN);
        }

        const bundle = await this.persistence.createBundle({
            input: {
                name: args.name,
                label: resolveLabel({ name: args.name, label: args.label }),
                hint: blankToNull(args.hint),
                isSystem: false,
            },
        });
        this.cache.clear();
        return bundle;
    }

    async get(args: { bundleId: string }): Promise<BundleDetail> {
        const bundle = await this.requireBundle(args.bundleId);
        const grants = await this.persistence.listBundleGrants(args);
        return { bundle, grants };
    }

    async update(args: {
        bundleId: string;
        label?: string;
        hint?: string | null;
    }): Promise<BundleRecord> {
        const bundle = await this.persistence.updateBundle({
            bundleId: args.bundleId,
            input: {
                label: args.label,
                hint: optionalHint(args.hint),
            },
        });
        if (!bundle) {
            throw new NotFoundException(RBAC_MESSAGES.BUNDLE_NOT_FOUND);
        }

        this.cache.clear();
        return bundle;
    }

    async delete(args: { bundleId: string }): Promise<void> {
        const bundle = await this.requireBundle(args.bundleId);
        if (bundle.isSystem) {
            throw new BadRequestException(
                RBAC_MESSAGES.SYSTEM_BUNDLE_DELETE_FORBIDDEN,
            );
        }

        const deleted = await this.persistence.deleteBundle(args);
        if (!deleted) {
            throw new NotFoundException(RBAC_MESSAGES.BUNDLE_NOT_FOUND);
        }
        this.cache.clear();
    }

    async replaceGrants(args: {
        bundleId: string;
        grants: Grant[];
    }): Promise<Grant[]> {
        await this.requireBundle(args.bundleId);
        const grants = await this.catalogGrants.acceptGrants({
            grants: args.grants,
        });
        const stored = await this.persistence.replaceBundleGrants({
            bundleId: args.bundleId,
            grants,
        });
        this.cache.clear();
        return stored;
    }

    private async requireBundle(bundleId: string): Promise<BundleRecord> {
        const bundle = await this.persistence.findBundle({ bundleId });
        if (!bundle) {
            throw new NotFoundException(RBAC_MESSAGES.BUNDLE_NOT_FOUND);
        }
        return bundle;
    }
}

export { BundlesService };
