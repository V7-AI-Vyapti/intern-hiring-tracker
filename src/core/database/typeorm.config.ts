import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { entitySchemas as generatedEntitySchemas } from '../../generated/entities';
import { entitySchemas as systemEntitySchemas } from '../../system_entities';
import { entitySchemas as processManagementEntitySchemas } from '../../vulcan/process_management/entities';
import { entitySchemas as fileManagementEntitySchemas } from '../../vulcan/file-management/entities';
import { entitySchemas as authEntitySchemas } from '../../auth/entities';
import { entitySchemas as rbacEntitySchemas } from '../../rbac/entities';
import { entitySchemas as accessPolicyEntitySchemas } from '../../access-policy/entities';
import { entitySchemas as hiringEntitySchemas } from '../../hiring/entities';

const dbType = (process.env.DB_TYPE ?? 'postgres') as 'postgres' | 'sqlite';

const shared = {
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    entities: [
        ...systemEntitySchemas,
        ...authEntitySchemas,
        ...rbacEntitySchemas,
        ...accessPolicyEntitySchemas,
        ...hiringEntitySchemas,
        ...generatedEntitySchemas,
        ...processManagementEntitySchemas,
        ...fileManagementEntitySchemas,
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
};

const dbConfig: DataSourceOptions =
    dbType === 'sqlite'
        ? {
              type: 'sqlite',
              database: process.env.DB_DATABASE ?? './tmp/dev.sqlite',
              ...shared,
          }
        : {
              type: 'postgres',
              host: process.env.DB_HOST ?? 'localhost',
              port: parseInt(process.env.DB_PORT ?? '5432', 10),
              username: process.env.DB_USERNAME ?? 'postgres',
              password: process.env.DB_PASSWORD ?? '',
              database: process.env.DB_DATABASE ?? 'postgres',
              ...shared,
          };

export const typeormConfig: DataSourceOptions = dbConfig;
const dataSource = new DataSource(typeormConfig);
export default dataSource;