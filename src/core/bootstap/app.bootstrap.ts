import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function bootstrapApp(app: INestApplication): void {
    const config = app.get(ConfigService);
    const apiPrefix = config.get<string>('app.apiPrefix');
    if (apiPrefix) {
        app.setGlobalPrefix(apiPrefix);
    }
    const origin = config.get<string[] | true>('app.corsOrigin') ?? true;
    const credentials = config.get<boolean>('app.corsCredentials') ?? true;
    app.enableCors({
        origin,
        credentials,
    });
    app.enableShutdownHooks();
}
