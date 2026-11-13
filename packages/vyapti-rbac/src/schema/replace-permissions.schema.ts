import { createZodDto } from 'nestjs-zod';
import { GrantListSchema } from './grant.schema.js';

class ReplaceGrantListRequestDto extends createZodDto(GrantListSchema) {}

export { ReplaceGrantListRequestDto };
