import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: (process.env.DB_TYPE ?? 'sqlite') as 'postgres' | 'mysql' | 'sqlite',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? './tmp/dev.sqlite',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
}));
