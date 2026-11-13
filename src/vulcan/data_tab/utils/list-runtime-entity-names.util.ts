import { DataSource } from 'typeorm';

export const listRuntimeEntityNames = (dataSource: DataSource): string[] => {
    const names = dataSource.entityMetadatas
        .map((metadata) => metadata.tableName)
        .filter((name): name is string =>
            Boolean(name && name.trim().length > 0),
        );

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
};
