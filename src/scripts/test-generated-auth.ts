import 'dotenv/config';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const API_PREFIX = (process.env.API_PREFIX ?? 'api').replace(/^\/+|\/+$/g, '');

function resolveBaseUrl(): string {
    return (process.env.GENERATED_AUTH_BASE_URL ?? DEFAULT_BASE_URL).replace(
        /\/+$/g,
        '',
    );
}

function authUrl(path: string): string {
    return `${resolveBaseUrl()}/${API_PREFIX}/v1/auth/${path.replace(/^\/+/, '')}`;
}

function healthCheckUrl(): string {
    return `${resolveBaseUrl()}/${API_PREFIX}/v1/vulcan/health-check`;
}

async function requestJson(args: {
    url: string;
    method: string;
    body?: unknown;
    token?: string;
    cookie?: string;
}): Promise<{ status: number; json: unknown; setCookie: string | null }> {
    const response = await fetch(args.url, {
        method: args.method,
        headers: {
            ...(args.body ? { 'Content-Type': 'application/json' } : {}),
            ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}),
            ...(args.cookie ? { Cookie: args.cookie } : {}),
        },
        body: args.body ? JSON.stringify(args.body) : undefined,
    });
    const text = await response.text();
    let json: unknown = null;
    if (text.length > 0) {
        try {
            json = JSON.parse(text) as unknown;
        } catch {
            json = text;
        }
    }
    const setCookie = response.headers.get('set-cookie');
    return { status: response.status, json, setCookie };
}

function readAccessToken(payload: unknown): string {
    const data =
        payload && typeof payload === 'object' && 'data' in payload
            ? (payload as { data: unknown }).data
            : payload;
    if (
        !data ||
        typeof data !== 'object' ||
        !('access_token' in data) ||
        typeof (data as { access_token: unknown }).access_token !== 'string'
    ) {
        throw new Error(`Login payload missing access_token: ${JSON.stringify(payload)}`);
    }
    return (data as { access_token: string }).access_token;
}

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Set ${name} before running test:auth`);
    }
    return value;
}

async function main(): Promise<void> {
    const email = requireEnv('APP_BOOTSTRAP_ADMIN_EMAIL');
    const password = requireEnv('APP_BOOTSTRAP_ADMIN_PASSWORD');

    const health = await requestJson({
        url: healthCheckUrl(),
        method: 'GET',
    });
    if (health.status !== 200) {
        throw new Error(`Health-check should stay public, got ${String(health.status)}`);
    }

    const unauthenticatedMe = await requestJson({
        url: authUrl('me'),
        method: 'GET',
    });
    if (unauthenticatedMe.status !== 401) {
        throw new Error(
            `Unauthenticated /auth/me should be 401, got ${String(unauthenticatedMe.status)}`,
        );
    }

    const login = await requestJson({
        url: authUrl('login'),
        method: 'POST',
        body: { email, password },
    });
    if (login.status !== 200 && login.status !== 201) {
        throw new Error(`Login failed (${String(login.status)}): ${JSON.stringify(login.json)}`);
    }
    const accessToken = readAccessToken(login.json);
    const refreshCookie = login.setCookie;
    if (!refreshCookie) {
        throw new Error('Login did not set a refresh cookie');
    }

    const refresh = await requestJson({
        url: authUrl('refresh'),
        method: 'POST',
        cookie: refreshCookie,
    });
    if (refresh.status !== 200 && refresh.status !== 201) {
        throw new Error(`Refresh failed (${String(refresh.status)})`);
    }

    const me = await requestJson({
        url: authUrl('me'),
        method: 'GET',
        token: accessToken,
    });
    if (me.status !== 200) {
        throw new Error(`/auth/me failed (${String(me.status)})`);
    }

    const issued = await requestJson({
        url: authUrl('api-keys'),
        method: 'POST',
        token: accessToken,
        body: { name: 'e2e' },
    });
    if (issued.status !== 200 && issued.status !== 201) {
        throw new Error(`Issue API key failed (${String(issued.status)})`);
    }

    console.log('Generated auth e2e passed: health-check, 401 /me, login, refresh, /me, api-keys');
}

main().catch((error: unknown) => {
    console.error('Generated auth e2e failed');
    console.error(error);
    process.exitCode = 1;
});
