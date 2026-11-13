import {
    HTTP_STATUS_CODES,
    type HttpStatusCode,
} from '@vulcan/shared/constants';

const HEALTH_CHECK_MESSAGES = {
    HEALTH_CHECK_OK: 'Service is healthy',
} as const;

const HEALTH_CHECK_STATUS = {
    OK: 'ok',
} as const;

type StatusCodeToMessage = Partial<Record<HttpStatusCode, string>>;

const HEALTH_CHECK_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: HEALTH_CHECK_MESSAGES.HEALTH_CHECK_OK,
} satisfies StatusCodeToMessage;

export { HEALTH_CHECK_MESSAGES, HEALTH_CHECK_RESPONSES, HEALTH_CHECK_STATUS };
