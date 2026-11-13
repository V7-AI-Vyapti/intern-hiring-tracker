import { HTTP_STATUS_CODES } from '../shared/constants';

export const PROCESS_MANAGEMENT_LIST_PROCESSES_RESPONSES: Record<
    number,
    string
> = {
    [HTTP_STATUS_CODES.OK]: 'Processes',
};

export const PROCESS_MANAGEMENT_VIEW_PROCESS_DETAILS_RESPONSES: Record<
    number,
    string
> = {
    [HTTP_STATUS_CODES.OK]: 'Process details',
    [HTTP_STATUS_CODES.NOT_FOUND]: 'Process not found',
};
