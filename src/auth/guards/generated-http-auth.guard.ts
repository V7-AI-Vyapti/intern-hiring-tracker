import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@vyapti/auth';
import { GENERATED_AUTH_CONFIG } from '../auth.config';

type HttpRequest = {
    path?: string;
    url?: string;
    originalUrl?: string;
};

@Injectable()
class GeneratedHttpAuthGuard implements CanActivate {
    constructor(private readonly authGuard: AuthGuard) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<HttpRequest>();
        if (this.isDocsRequest(request)) {
            return true;
        }
        return this.authGuard.canActivate(context);
    }

    private isDocsRequest(request: HttpRequest): boolean {
        const path = request.path ?? request.originalUrl ?? request.url ?? '';
        const pathname = path.split('?')[0] ?? '';
        return (
            pathname === GENERATED_AUTH_CONFIG.DOCS_PATH_PREFIX ||
            pathname.startsWith(`${GENERATED_AUTH_CONFIG.DOCS_PATH_PREFIX}/`)
        );
    }
}

export { GeneratedHttpAuthGuard };
