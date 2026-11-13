import {
    ConflictException,
    ForbiddenException,
    UnprocessableEntityException,
} from '@nestjs/common';

const conflict = (message: string): never => {
    throw new ConflictException(message);
};

const forbidden = (message = 'Forbidden'): never => {
    throw new ForbiddenException(message);
};

const unprocessable = (field: string, message: string): never => {
    throw new UnprocessableEntityException({ field, message });
};

export { conflict, forbidden, unprocessable };
