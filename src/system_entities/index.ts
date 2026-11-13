import { buildEntitySchema } from '@vyapti/core';
import { AvailableTool } from './available_tool.entity';
import { Entity } from './entity.entity';

const entitySchemas = [
    buildEntitySchema(Entity),
    buildEntitySchema(AvailableTool),
];

export { entitySchemas };
