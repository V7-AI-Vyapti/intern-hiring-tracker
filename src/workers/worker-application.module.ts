import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configLoaders } from '../core/config';
import { typeormConfig } from '../core/database/typeorm.config';
import { workerFeatureModules } from './worker-feature-modules';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
            load: [...configLoaders],
        }),
        TypeOrmModule.forRoot(typeormConfig),
        ...workerFeatureModules,
    ],
})
export class WorkerApplicationModule {}
