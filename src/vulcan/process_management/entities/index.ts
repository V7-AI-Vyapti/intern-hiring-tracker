import { buildEntitySchema } from '@vyapti/core';
import { OperationStatus } from './operation_status.entity';
import { Process } from './process.entity';
import { Tool } from './tool.entity';
import { ToolType } from './tool_type.entity';

export const entitySchemas = [
    buildEntitySchema(OperationStatus),
    buildEntitySchema(Process),
    buildEntitySchema(Tool),
    buildEntitySchema(ToolType),
];
