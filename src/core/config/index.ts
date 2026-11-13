import appConfig from './app.config';
import databaseConfig from './database.config';
import queueConfig from './queue.config';

export const configLoaders = [
    appConfig,
    databaseConfig,
    queueConfig,
];
