import {
    applyDecorators,
    Delete,
    Get,
    HttpCode,
    Patch,
    Post,
    Put,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';

type HttpMethod = 'post' | 'get' | 'put' | 'patch' | 'delete';

const methodMap = {
    post: Post,
    get: Get,
    put: Put,
    patch: Patch,
    delete: Delete,
};

type EndpointConfig = {
    method: HttpMethod;
    path: string;
    tags?: string[];
    responses?: Record<number, string>;
    consumes?: string[];
    body?: Parameters<typeof ApiBody>[0];
    interceptors?: Parameters<typeof UseInterceptors>;
    decorators?: MethodDecorator[];
};

export function buildEndpoint(config: EndpointConfig) {
    const methodDecorator = methodMap[config.method];
    const firstStatusCode = config.responses
        ? Number(Object.keys(config.responses)[0])
        : 200;

    return applyDecorators(
        methodDecorator(config.path),
        HttpCode(firstStatusCode),
        ...(config.tags ?? []).map((tag) => ApiTags(tag)),
        ...Object.entries(config.responses ?? {}).map(([status, desc]) =>
            ApiResponse({ status: Number(status), description: desc }),
        ),
        ...(config.consumes?.length ? [ApiConsumes(...config.consumes)] : []),
        ...(config.body ? [ApiBody(config.body)] : []),
        ...(config.interceptors?.length
            ? [UseInterceptors(...config.interceptors)]
            : []),
        ...(config.decorators ?? []),
    );
}
