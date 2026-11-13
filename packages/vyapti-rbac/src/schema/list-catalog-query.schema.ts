import { createZodDto } from 'nestjs-zod';
import { CatalogPageQuerySchema } from './page-query.schema.js';

class ListCatalogQueryDto extends createZodDto(CatalogPageQuerySchema) {}

export { ListCatalogQueryDto };
