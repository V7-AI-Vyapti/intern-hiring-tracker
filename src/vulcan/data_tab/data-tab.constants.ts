import { HTTP_STATUS_CODES } from '@vulcan/shared/constants';

const DATA_TAB_MESSAGES = {
    ENTITY_TOOLS_FETCHED: 'Entity tools fetched',
    ENTITY_DATAPOINTS_FETCHED: 'Entity datapoints fetched',
    ENTITY_NOT_FOUND: 'Entity not found in project',
} as const;

const DATA_TAB_LIST_ENTITIES_RESPONSES: Record<number, string> = {
    [HTTP_STATUS_CODES.OK]: 'Entities',
};

export { DATA_TAB_MESSAGES, DATA_TAB_LIST_ENTITIES_RESPONSES };
