import { type ModelClass } from '../types.js';

export function deriveTableName(
    modelClass: ModelClass,
    entityName: string,
): string {
    if (modelClass.tableName) return modelClass.tableName;
    return `${entityName.toLowerCase()}s`;
}
