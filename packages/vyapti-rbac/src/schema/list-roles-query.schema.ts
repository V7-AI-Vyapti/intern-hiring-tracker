import { createZodDto } from 'nestjs-zod';
import { NameSortedPageQuerySchema } from './page-query.schema.js';

class ListRolesQueryDto extends createZodDto(NameSortedPageQuerySchema) {}

export { ListRolesQueryDto, NameSortedPageQuerySchema as ListRolesQuerySchema };
