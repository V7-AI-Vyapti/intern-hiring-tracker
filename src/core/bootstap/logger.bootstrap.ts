import { INestApplication, Logger } from '@nestjs/common';

export function bootstrapLogger(app: INestApplication): void {
    app.useLogger(new Logger());
}
