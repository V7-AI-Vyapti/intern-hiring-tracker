/**
 * Hiring host does not introduce extra TypeORM tables.
 * Catalog wiring still expects an entitySchemas export for generate.
 */
const entitySchemas: never[] = [];

export { entitySchemas };
