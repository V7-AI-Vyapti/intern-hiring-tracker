import { createZodDto } from 'nestjs-zod';
import { NameSortedPageQuerySchema } from './page-query.schema.js';

class ListBundlesQueryDto extends createZodDto(NameSortedPageQuerySchema) {}

export { ListBundlesQueryDto };
