import {
    PUBLIC_APPLICATION_FORM_CONFIG,
    PUBLIC_APPLICATION_FORM_HTTP_SEED,
    PUBLIC_APPLICATION_FORM_KEY,
    PUBLIC_APPLICATION_LOCATION_ID,
} from '@vyapti/hiring';

/**
 * Optional Forms studio seed for Intern Hiring Tracker hosts.
 *
 * Copy / POST these rows via `@vyapti/forms` admin APIs when the generated app
 * includes Forms. Capture/submit remains `POST /api/v1/hiring/apply`
 * (`PublicApplyService`) — Forms has no public submit endpoint in v1.
 */
const PUBLIC_APPLICATION_FORM_FIXTURE = {
    form: PUBLIC_APPLICATION_FORM_CONFIG,
    httpSeed: PUBLIC_APPLICATION_FORM_HTTP_SEED,
    formKey: PUBLIC_APPLICATION_FORM_KEY,
    locationId: PUBLIC_APPLICATION_LOCATION_ID,
} as const;

export {
    PUBLIC_APPLICATION_FORM_CONFIG,
    PUBLIC_APPLICATION_FORM_FIXTURE,
    PUBLIC_APPLICATION_FORM_HTTP_SEED,
    PUBLIC_APPLICATION_FORM_KEY,
    PUBLIC_APPLICATION_LOCATION_ID,
};
