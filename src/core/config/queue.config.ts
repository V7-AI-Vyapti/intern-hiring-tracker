import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
    redis: {
        host: process.env.QUEUE_REDIS_HOST ?? '127.0.0.1',
        port: parseInt(process.env.QUEUE_REDIS_PORT ?? '6379', 10),
        username: process.env.QUEUE_REDIS_USERNAME,
        password: process.env.QUEUE_REDIS_PASSWORD,
        db: parseInt(process.env.QUEUE_REDIS_DB ?? '0', 10),
    },
    projectGen: {
        queueName: process.env.PROJECT_GEN_QUEUE_NAME ?? 'project_generation',
        attempts: parseInt(process.env.PROJECT_GEN_QUEUE_ATTEMPTS ?? '1', 10),
        removeOnComplete: parseInt(
            process.env.PROJECT_GEN_QUEUE_REMOVE_ON_COMPLETE ?? '100',
            10,
        ),
        removeOnFail: parseInt(
            process.env.PROJECT_GEN_QUEUE_REMOVE_ON_FAIL ?? '100',
            10,
        ),
    },
    projectDeploy: {
        queueName: process.env.PROJECT_DEPLOY_QUEUE_NAME ?? 'project_deploy',
        attempts: parseInt(
            process.env.PROJECT_DEPLOY_QUEUE_ATTEMPTS ?? '1',
            10,
        ),
        removeOnComplete: parseInt(
            process.env.PROJECT_DEPLOY_QUEUE_REMOVE_ON_COMPLETE ?? '100',
            10,
        ),
        removeOnFail: parseInt(
            process.env.PROJECT_DEPLOY_QUEUE_REMOVE_ON_FAIL ?? '100',
            10,
        ),
    },
    excelToCsv: {
        queueName: process.env.EXCEL_TO_CSV_QUEUE_NAME ?? 'excel_to_csv',
        attempts: parseInt(process.env.EXCEL_TO_CSV_QUEUE_ATTEMPTS ?? '1', 10),
        removeOnComplete: parseInt(
            process.env.EXCEL_TO_CSV_QUEUE_REMOVE_ON_COMPLETE ?? '100',
            10,
        ),
        removeOnFail: parseInt(
            process.env.EXCEL_TO_CSV_QUEUE_REMOVE_ON_FAIL ?? '100',
            10,
        ),
    },
}));
