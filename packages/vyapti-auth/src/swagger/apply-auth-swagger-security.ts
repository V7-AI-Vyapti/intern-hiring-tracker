import { AUTH_SWAGGER } from '../auth.constants.js';

type SwaggerBearerDocumentBuilder<T> = {
    addBearerAuth(
        options?: {
            type: 'http';
            scheme: string;
            bearerFormat?: string;
            description?: string;
        },
        name?: string,
    ): T;
};

function applyAuthSwaggerSecurity<T extends SwaggerBearerDocumentBuilder<T>>(
    documentBuilder: T,
): T {
    return documentBuilder.addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT or API key',
            description:
                'JWT access token or API key (v7ak_<prefix>_<secret>) in the Authorization header.',
        },
        AUTH_SWAGGER.BEARER_SCHEME,
    );
}

export { applyAuthSwaggerSecurity };
