import { registerAs } from '@nestjs/config';

function parseCorsOrigin(): string[] | true {
    const raw = process.env.CORS_ORIGIN?.trim();
    if (!raw || raw === '*') {
        return true;
    }
    const origins = raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    return origins.length > 0 ? origins : true;
}

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiPrefix: process.env.API_PREFIX ?? 'api',
    name: process.env.APP_NAME ?? 'app',
    corsOrigin: parseCorsOrigin(),
    corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
}));
