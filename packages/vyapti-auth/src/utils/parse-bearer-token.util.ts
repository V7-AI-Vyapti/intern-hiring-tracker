const BEARER_PREFIX = 'Bearer ';

function parseBearerToken(authorization: unknown): string | null {
    const header = Array.isArray(authorization)
        ? authorization[0]
        : authorization;
    if (typeof header !== 'string') {
        return null;
    }

    const trimmed = header.trim();
    if (!trimmed.toLowerCase().startsWith(BEARER_PREFIX.toLowerCase())) {
        return null;
    }

    const token = trimmed.slice(BEARER_PREFIX.length).trim();
    return token.length > 0 ? token : null;
}

export { parseBearerToken };
