function normalizeRoutePrefix(routePrefix: string): string {
    return routePrefix.trim().replace(/^\/+|\/+$/g, '');
}

function routePrefixToCookiePath(routePrefix: string): string {
    const normalized = normalizeRoutePrefix(routePrefix);
    return normalized.length > 0 ? `/${normalized}` : '/';
}

export { normalizeRoutePrefix, routePrefixToCookiePath };
