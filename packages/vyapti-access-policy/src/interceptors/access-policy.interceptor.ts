import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { ACCESS_POLICY_MODULE_OPTIONS } from '../access-policy.tokens.js';
import { ACCESS_POLICY_ENTITY_KEY } from '../decorators/access-policy-entity.decorator.js';
import { AccessPolicyFilterService } from '../services/access-policy-filter.service.js';
import type {
    AccessPolicyRequest,
    ResolvedAccessPolicyModuleOptions,
} from '../types/access-policy.types.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Injectable()
class AccessPolicyInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly filters: AccessPolicyFilterService,
        @Inject(ACCESS_POLICY_MODULE_OPTIONS)
        private readonly options: ResolvedAccessPolicyModuleOptions,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const entityName = this.reflector.getAllAndOverride<string | undefined>(
            ACCESS_POLICY_ENTITY_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!entityName) {
            return next.handle();
        }
        return this.attachFilter({ context, next, entityName });
    }

    private async attachFilter(args: {
        context: ExecutionContext;
        next: CallHandler;
        entityName: string;
    }): Promise<Observable<unknown>> {
        const request = args.context
            .switchToHttp()
            .getRequest<AccessPolicyRequest>();
        const user = requireRequestUser(request);
        request.accessPolicy = await this.filters.resolveFilter({
            userId: user.id,
            entityName: args.entityName,
            isSystemAdmin: this.options.readIsSystemAdmin(request),
        });
        return args.next.handle();
    }
}

export { AccessPolicyInterceptor };
