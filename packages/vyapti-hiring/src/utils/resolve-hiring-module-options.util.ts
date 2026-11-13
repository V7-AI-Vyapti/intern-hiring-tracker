import { HIRING_ROUTE_PREFIX } from '../hiring.constants.js';
import type { HiringModuleRootOptions } from '../types/hiring.types.js';
import { todayKolkata } from './kolkata-date.util.js';

const resolveHiringModuleOptions = (
    options: HiringModuleRootOptions,
): HiringModuleRootOptions & {
    routePrefix: string;
    today: () => string;
    nowIso: () => string;
} => ({
    ...options,
    routePrefix: options.routePrefix ?? HIRING_ROUTE_PREFIX,
    today: options.today ?? todayKolkata,
    nowIso: options.nowIso ?? (() => new Date().toISOString()),
});

export { resolveHiringModuleOptions };
