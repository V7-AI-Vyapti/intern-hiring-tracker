import { Inject, Injectable } from '@nestjs/common';
import { AUTH_MODULE_OPTIONS } from '../auth.tokens.js';
import type { ResolvedAuthModuleOptions } from '../types/auth.types.js';
import { readCookieValue, serializeCookie } from '../utils/cookie.util.js';

type HeaderMap = Record<string, string | string[] | undefined>;

type CookieWritable = {
    setHeader(name: string, value: string): void;
};

@Injectable()
class RefreshCookieService {
    constructor(
        @Inject(AUTH_MODULE_OPTIONS)
        private readonly options: ResolvedAuthModuleOptions,
    ) {}

    read(headers: HeaderMap): string | null {
        const cookieHeader = headers.cookie;
        const header = Array.isArray(cookieHeader)
            ? cookieHeader.join('; ')
            : cookieHeader;
        return readCookieValue({
            cookieHeader: header,
            name: this.options.cookieName,
        });
    }

    set(response: CookieWritable, rawToken: string): void {
        response.setHeader(
            'Set-Cookie',
            serializeCookie({
                name: this.options.cookieName,
                value: rawToken,
                path: this.options.cookiePath,
                maxAgeSeconds: this.options.jwt.refreshTtlSeconds,
                secure: this.options.cookieSecure,
            }),
        );
    }

    clear(response: CookieWritable): void {
        response.setHeader(
            'Set-Cookie',
            serializeCookie({
                name: this.options.cookieName,
                value: '',
                path: this.options.cookiePath,
                maxAgeSeconds: 0,
                secure: this.options.cookieSecure,
            }),
        );
    }
}

export { RefreshCookieService };
