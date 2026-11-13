import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { applyAuthSwaggerSecurity } from '@vyapti/auth';
import { AppModule } from './app.module';
import { bootstrapApp } from './core/bootstap/app.bootstrap';
import { bootstrapLogger } from './core/bootstap/logger.bootstrap';
import { bootstrapValidation } from './core/bootstap/validation.bootstrap';
import { ApiExceptionFilter } from './core/filters/api-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new ApiExceptionFilter());
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    bootstrapValidation(app);
    bootstrapLogger(app);
    bootstrapApp(app);

    const config = app.get(ConfigService);
    const appName = config.get<string>('app.name') ?? 'Generated API';
    const swaggerConfig = applyAuthSwaggerSecurity(
        new DocumentBuilder()
            .setTitle(appName)
            .setDescription(`${appName} API`)
            .setVersion('1'),
    );
    const document = SwaggerModule.createDocument(app, swaggerConfig.build(), {
        autoTagControllers: false,
    });
    SwaggerModule.setup('docs', app, document);

    const port = config.get<number>('app.port') ?? 3000;
    await app.listen(port, '0.0.0.0');
}

void bootstrap();
