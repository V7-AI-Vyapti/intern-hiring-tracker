import { Inject, Injectable } from '@nestjs/common';
import { RBAC_PERSISTENCE_ADAPTER } from '../rbac.tokens.js';
import type {
    CatalogResourceRecord,
    RbacPersistenceAdapter,
} from '../types/rbac.types.js';
import { paginateRows } from '../utils/paginate.util.js';

type ListCatalogArgs = {
    page: number;
    limit: number;
    search: string | null;
    sortOrder: 'ASC' | 'DESC';
};

@Injectable()
class CatalogService {
    constructor(
        @Inject(RBAC_PERSISTENCE_ADAPTER)
        private readonly persistence: RbacPersistenceAdapter,
    ) {}

    async list(args: ListCatalogArgs): Promise<{
        rows: CatalogResourceRecord[];
        total: number;
        page: number;
        limit: number;
    }> {
        const resources = await this.persistence.listCatalog();
        const matched = filterCatalog({ resources, search: args.search });
        const sorted = sortCatalog({
            resources: matched,
            sortOrder: args.sortOrder,
        });
        return paginateRows({
            rows: sorted,
            page: args.page,
            limit: args.limit,
        });
    }
}

function filterCatalog(args: {
    resources: CatalogResourceRecord[];
    search: string | null;
}): CatalogResourceRecord[] {
    if (!args.search) {
        return args.resources;
    }

    const needle = args.search.toLowerCase();
    const matched: CatalogResourceRecord[] = [];
    for (const resource of args.resources) {
        if (resource.resource.toLowerCase().includes(needle)) {
            matched.push(resource);
        }
    }
    return matched;
}

function sortCatalog(args: {
    resources: CatalogResourceRecord[];
    sortOrder: 'ASC' | 'DESC';
}): CatalogResourceRecord[] {
    const sorted = [...args.resources];
    sorted.sort(function byResource(left, right) {
        const order = left.resource.localeCompare(right.resource);
        if (args.sortOrder === 'ASC') {
            return order;
        }
        return -order;
    });
    return sorted;
}

export { CatalogService };
