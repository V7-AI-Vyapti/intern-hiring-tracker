import { type Type } from '@nestjs/common';
import { type ModuleMetadata } from '@nestjs/common/interfaces';
import { GeneratedIngestWorkersModule } from '../generated/workers/generated-ingest-workers.module';
import { GeneratedApiGenerateWorkersModule } from '../generated/workers/generated-api-generate-workers.module';
import { FileManagementWorkersModule } from '../vulcan/file-management/file-management-workers.module';

type NestModuleImport = NonNullable<ModuleMetadata['imports']>[number];

/**
 * Every background-worker domain module registers here.
 * Worker process composition should not import feature services directly.
 */
export const workerFeatureModules = [
    GeneratedIngestWorkersModule,
    GeneratedApiGenerateWorkersModule,
    FileManagementWorkersModule,
] as const satisfies ReadonlyArray<Type<unknown> | NestModuleImport>;
