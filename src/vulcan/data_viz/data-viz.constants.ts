const DATA_VIZ_MESSAGES = {
    VIZ_CONFIG_FETCHED: 'Visualization config fetched',
    VIZ_DATA_FETCHED: 'Visualization data fetched',
    ENTITY_NOT_FOUND: 'Entity not found in project',
    NON_NUMERIC_MEASURE_VALUE: (field: string) =>
        `Field '${field}' contains non-numeric values`,
    NO_GEO_FIELDS: 'Entity has no detectable lat/lon field pair',
} as const;

const VIZ_DATA_ERRORS = {
    INVALID_X_FIELD: (field: string, entity: string) =>
        `Field '${field}' is not a valid dimension on entity '${entity}'`,
    INVALID_Y_FIELD: (field: string, entity: string) =>
        `Field '${field}' is not a valid measure on entity '${entity}'`,
    INVALID_Y_FIELD_DIMENSION: (field: string, entity: string) =>
        `Field '${field}' is not a valid dimension on entity '${entity}'`,
    INVALID_VALUE_FIELD: (field: string, entity: string) =>
        `Field '${field}' is not a valid measure on entity '${entity}'`,
    INVALID_GEO_VALUE_FIELD: (field: string, entity: string) =>
        `Field '${field}' is not a valid measure on entity '${entity}'`,
} as const;

export { DATA_VIZ_MESSAGES, VIZ_DATA_ERRORS };
