import { Controller, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { RBAC_ROUTE_PATHS } from '../rbac.config.js';
import {
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
    RBAC_MESSAGES,
    RBAC_TAGS,
} from '../rbac.constants.js';
import {
    serializeSession,
    type SessionResponse,
} from '../serializers/rbac.serializer.js';
import { SessionService } from '../services/session.service.js';
import type { RbacRequest } from '../types/rbac.types.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Controller()
class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.ME,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.SESSION_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: RBAC_MESSAGES.UNAUTHORIZED,
        },
    })
    async get(
        @Req() request: RbacRequest,
    ): Promise<ApiSuccessResponse<SessionResponse>> {
        const user = requireRequestUser(request);
        const session = await this.sessionService.get({
            userId: user.id,
            context: request.rbacContext,
        });
        return apiSuccess(serializeSession(session), {
            message: RBAC_MESSAGES.SESSION_FETCHED,
        });
    }
}

export { SessionController };
