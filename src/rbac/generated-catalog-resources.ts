const GENERATED_CATALOG_RESOURCES = [
    { resource: 'job_assessment', actions: ['create', 'delete', 'list', 'update', 'view'] },
    { resource: 'job_candidate', actions: ['create', 'delete', 'list', 'update', 'view'] },
    { resource: 'job_interview', actions: ['create', 'delete', 'list', 'update', 'view'] },
    { resource: 'job_opening', actions: ['create', 'delete', 'list', 'update', 'view'] },
    { resource: 'team_member', actions: ['create', 'delete', 'list', 'update', 'view'] },
] as const;

export { GENERATED_CATALOG_RESOURCES };
