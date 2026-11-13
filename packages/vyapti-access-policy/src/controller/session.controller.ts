import { Controller, Inject, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { ACCESS_POLICY_ROUTE_PATHS } from '../access-policy.config.js';
import {
    ACCESS_POLICY_MESSAGES,
    ACCESS_POLICY_TAGS,
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
} from '../access-policy.constants.js';
import { ACCESS_POLICY_MODULE_OPTIONS } from '../access-policy.tokens.js';
import {
    serializeSession,
    type SessionResponse,
} from '../serializers/access-policy.serializer.js';
import { SessionService } from '../services/session.service.js';
import type {
    AccessPolicyRequest,
    ResolvedAccessPolicyModuleOptions,
} from '../types/access-policy.types.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Controller()
class SessionController {
    constructor(
        private readonly sessionService: SessionService,
        @Inject(ACCESS_POLICY_MODULE_OPTIONS)
        private readonly options: ResolvedAccessPolicyModuleOptions,
    ) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: ACCESS_POLICY_ROUTE_PATHS.ME,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.SESSION_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]:
                ACCESS_POLICY_MESSAGES.UNAUTHORIZED,
        },
    })
    async get(
        @Req() request: AccessPolicyRequest,
    ): Promise<ApiSuccessResponse<SessionResponse>> {
        const user = requireRequestUser(request);
        const access = await this.sessionService.get({
            userId: user.id,
            isSystemAdmin: this.options.readIsSystemAdmin(request),
        });
        return apiSuccess(serializeSession(access), {
            message: ACCESS_POLICY_MESSAGES.SESSION_FETCHED,
        });
    }
}

export { SessionController };
