import { type ModelClass } from '../types.js';

export function deriveEntityName(modelClass: ModelClass): string {
    if (modelClass.entityName) return modelClass.entityName;
    return modelClass.name.replace(/Model$/, '');
}
