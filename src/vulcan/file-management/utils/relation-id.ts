type AnyRow = Record<string, unknown>;

/**
 * TypeORM entities in this repo sometimes surface relations as:
 * - a numeric FK
 * - an object containing the FK field (e.g. { file_id: 1 })
 * - null/undefined
 */
export function readRelationId(
    relation: unknown,
    idKey: string,
): number | null {
    if (relation === null || relation === undefined) return null;
    if (typeof relation === 'number') return relation;
    if (
        typeof relation === 'object' &&
        relation !== null &&
        idKey in relation
    ) {
        return (relation as AnyRow)[idKey] as number;
    }
    return null;
}
