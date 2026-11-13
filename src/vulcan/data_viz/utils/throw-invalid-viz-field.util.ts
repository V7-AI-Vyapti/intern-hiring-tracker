import { BadRequestException } from '@nestjs/common';
import { ApiErrorCode } from '@vyapti/core/custom_api_response';

function throwInvalidVizField(message: string): never {
    throw new BadRequestException({
        message,
        code: ApiErrorCode.INVALID_FIELD,
    });
}

export { throwInvalidVizField };
