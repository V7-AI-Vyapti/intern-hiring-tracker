import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
    ApiErrorCode,
    apiFailure,
    type ApiErrorDetail,
} from '@vyapti/core/custom_api_response';
import { QueryFailedError } from 'typeorm';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ApiExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const res = host.switchToHttp().getResponse<Response>();
        const isProd = process.env.NODE_ENV === 'production';

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const { message, details } = normalizeHttpExceptionResponse(
                exception.getResponse() as string | Record<string, unknown>,
            );
            const code = statusToApiErrorCode(status, details);
            res.status(status).json(apiFailure(message, { code, details }));
            return;
        }

        if (isUniqueConstraintError(exception)) {
            const details = uniqueKeyConflictDetails(exception);
            res.status(HttpStatus.CONFLICT).json(
                apiFailure('A record with this value already exists.', {
                    code: ApiErrorCode.CONFLICT,
                    ...(details?.length ? { details } : {}),
                }),
            );
            return;
        }

        this.logger.error(
            exception instanceof Error ? exception.stack : String(exception),
        );

        const message = isProd
            ? 'Internal server error'
            : exception instanceof Error
              ? exception.message
              : 'Internal server error';

        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
            apiFailure(message, { code: ApiErrorCode.INTERNAL_ERROR }),
        );
    }
}

function isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;

    const driverError = (error as QueryFailedError & { driverError?: unknown })
        .driverError as
        | { code?: string | number; errno?: string | number; message?: string }
        | undefined;

    const code = String(driverError?.code ?? driverError?.errno ?? '');
    if (
        code === '23505' ||
        code === '1062' ||
        code === '19' ||
        code === 'SQLITE_CONSTRAINT' ||
        code === 'ER_DUP_ENTRY'
    ) {
        return true;
    }

    return /unique|duplicate/i.test(driverError?.message ?? '');
}

/** Postgres 23505 `detail` often looks like: `Key (project_slug)=(x) already exists.` */
function uniqueKeyConflictDetails(
    error: unknown,
): ApiErrorDetail[] | undefined {
    if (!(error instanceof QueryFailedError)) return undefined;
    const driver = (
        error as QueryFailedError & {
            driverError?: { code?: string; detail?: string };
        }
    ).driverError;
    if (
        String(driver?.code ?? '') !== '23505' ||
        typeof driver?.detail !== 'string'
    )
        return undefined;

    const m = /^Key \(([^)]+)\)=/.exec(driver.detail);
    if (!m) return undefined;
    const fields = m[1]
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    if (!fields.length) return undefined;

    return fields.map((field) => ({
        field,
        message: 'This value is already in use.',
    }));
}

function normalizeHttpExceptionResponse(
    raw: string | Record<string, unknown>,
): { message: string; details?: ApiErrorDetail[] } {
    if (typeof raw === 'string') {
        return { message: raw };
    }

    const msg = raw['message'];
    if (Array.isArray(msg)) {
        const strings = msg.map((m) => String(m));
        return {
            message: strings.join('; '),
            details: strings.map((text) => ({
                field: '',
                message: text,
            })),
        };
    }
    if (typeof msg === 'string') {
        return { message: msg };
    }

    return { message: 'Request failed' };
}

function statusToApiErrorCode(
    status: number,
    details: ApiErrorDetail[] | undefined,
): string {
    if (status === (HttpStatus.NOT_FOUND as number))
        return ApiErrorCode.NOT_FOUND;
    if (status === (HttpStatus.FORBIDDEN as number))
        return ApiErrorCode.PERMISSION_DENIED;
    if (status === (HttpStatus.CONFLICT as number))
        return ApiErrorCode.CONFLICT;
    if (status === (HttpStatus.UNAUTHORIZED as number))
        return ApiErrorCode.INVALID_TOKEN;
    if (status === (HttpStatus.BAD_REQUEST as number)) {
        return details?.length
            ? ApiErrorCode.VALIDATION_ERROR
            : ApiErrorCode.BAD_REQUEST;
    }
    if (status >= 400 && status < 500) return ApiErrorCode.BAD_REQUEST;
    return ApiErrorCode.INTERNAL_ERROR;
}
