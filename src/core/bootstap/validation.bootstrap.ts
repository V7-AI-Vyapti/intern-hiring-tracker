import {
    BadRequestException,
    type ArgumentMetadata,
    type INestApplication,
    Injectable,
    type PipeTransform,
} from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

const ZodValidationPipeBase = createZodValidationPipe({
    strictSchemaDeclaration: false,
});

@Injectable()
class VyaptiZodValidationPipe
    extends ZodValidationPipeBase
    implements PipeTransform
{
    transform(value: unknown, metadata: ArgumentMetadata): unknown {
        if (
            metadata.type !== 'body' &&
            metadata.type !== 'query' &&
            metadata.type !== 'param'
        ) {
            return value;
        }

        const metatype = metadata.metatype as
            | { isZodDto?: boolean }
            | undefined;
        if (!metatype?.isZodDto) {
            throw new BadRequestException(
                `Route parameter (type: ${metadata.type}) must use a Zod DTO created with createZodDto().`,
            );
        }

        return super.transform(value, metadata);
    }
}

export function bootstrapValidation(app: INestApplication): void {
    app.useGlobalPipes(new VyaptiZodValidationPipe());
}
