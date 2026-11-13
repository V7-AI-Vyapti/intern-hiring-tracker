import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configLoaders } from './core/config';
import { typeormConfig } from './core/database/typeorm.config';
import { VulcanModule } from './vulcan/vulcan.module';
import { GeneratedIngestApiModule } from '@available-tools/generated-ingest-api.module';
import { GeneratedApiGenerateApiModule } from '@available-tools/generated-api-generate-api.module';
import { GeneratedCrudApiModule } from '@generated-crud/generated-crud-api.module';
import { GeneratedAuthModule } from './auth/auth.module';
import { GeneratedRbacModule } from './rbac/rbac.module';
import { GeneratedAccessPolicyModule } from './access-policy/access-policy.module';
import { GeneratedHiringModule } from './hiring/hiring.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
            load: [...configLoaders],
        }),
        TypeOrmModule.forRoot(typeormConfig),
        GeneratedAuthModule,
        GeneratedRbacModule,
        GeneratedAccessPolicyModule,
        GeneratedHiringModule,
        VulcanModule,
        GeneratedIngestApiModule,
        GeneratedApiGenerateApiModule,
        GeneratedCrudApiModule,
    ],
})
export class AppModule {}
