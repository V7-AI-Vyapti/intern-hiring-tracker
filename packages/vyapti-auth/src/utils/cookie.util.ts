import { AUTH_COOKIE } from '../auth.constants.js';

function serializeCookie(args: {
    name: string;
    value: string;
    path: string;
    maxAgeSeconds: number;
    secure: boolean;
}): string {
    const parts = [
        `${args.name}=${args.value}`,
        'HttpOnly',
        `SameSite=${AUTH_COOKIE.SAME_SITE}`,
        `Path=${args.path}`,
        `Max-Age=${Math.max(0, args.maxAgeSeconds)}`,
    ];
    if (args.secure) {
        parts.push('Secure');
    }
    return parts.join('; ');
}

function readCookieValue(args: {
    cookieHeader: string | undefined;
    name: string;
}): string | null {
    if (!args.cookieHeader) {
        return null;
    }

    const parts = args.cookieHeader.split(';');
    for (const part of parts) {
        const trimmed = part.trim();
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) {
            continue;
        }
        const name = trimmed.slice(0, separatorIndex);
        if (name !== args.name) {
            continue;
        }
        const value = trimmed.slice(separatorIndex + 1);
        return value.length > 0 ? value : null;
    }

    return null;
}

export { readCookieValue, serializeCookie };
