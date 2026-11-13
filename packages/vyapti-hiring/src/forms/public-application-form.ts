import { SOURCES } from '../hiring.enums.js';

/**
 * Client-owned careers application form configuration.
 *
 * `@vyapti/forms` stores definitions / locations / publish state only — it has
 * no public submit API and no anonymous capture GET in v1 (FORM-03). Hiring
 * therefore owns:
 * - this Forms-compatible schema (for FE render or Forms studio seed)
 * - capture via {@link PublicApplyService} / `POST …/apply`
 *
 * Field keys match {@link PublicApplyInput} / `job_candidate` applicant columns.
 */

const PUBLIC_APPLICATION_FORM_KEY = 'intern_hiring_public_apply';
const PUBLIC_APPLICATION_LOCATION_ID = 'careers.public_apply';
const PUBLIC_APPLICATION_FORM_TITLE = 'Intern application';
const PUBLIC_APPLICATION_FORM_KIND = 'single_page' as const;
const PUBLIC_APPLICATION_STEP_ID = 'main';
const PUBLIC_APPLICATION_SECTION_ID = 'candidate';

/** Tiny 1×1 PNG — satisfies Forms brand_image shape if seeded in studio. */
const PUBLIC_APPLICATION_BRAND_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const PUBLIC_APPLICATION_FIELD_KEYS = [
    'opening_id',
    'name',
    'email',
    'college',
    'degree',
    'graduation_year',
    'source',
    'resume_link',
] as const;

type PublicApplicationFieldKey = (typeof PUBLIC_APPLICATION_FIELD_KEYS)[number];

type PublicApplicationFormField = {
    key: PublicApplicationFieldKey;
    label: string;
    widget: string;
    stepId: string;
    sectionId: string;
    order: number;
    required: boolean;
    enabled: boolean;
    placeholder: string | null;
    hint: string | null;
    options: Array<{ id: string; label: string }>;
    optionSource: string;
    col: number | null;
    span: number | null;
    row: number | null;
    spanLocked: boolean;
    extras: Record<string, unknown>;
};

type PublicApplicationFormStructure = {
    steps: Array<{
        id: string;
        title: string;
        hint: string | null;
        order: number;
    }>;
    sections: Array<{
        id: string;
        stepId: string;
        title: string;
        hint: string | null;
        order: number;
    }>;
    fields: PublicApplicationFormField[];
};

type PublicApplicationFormConfig = {
    key: string;
    locationId: string;
    title: string;
    description: string;
    kind: typeof PUBLIC_APPLICATION_FORM_KIND;
    brandImage: string;
    brandDetailRequired: boolean;
    status: 'published';
    version: number;
    structure: PublicApplicationFormStructure;
    /** Allowed answer keys; anything else is ignored / rejected by the mapper. */
    fieldKeys: readonly PublicApplicationFieldKey[];
};

function field(
    partial: Omit<
        PublicApplicationFormField,
        | 'stepId'
        | 'sectionId'
        | 'enabled'
        | 'optionSource'
        | 'col'
        | 'span'
        | 'row'
        | 'spanLocked'
        | 'extras'
        | 'options'
        | 'placeholder'
        | 'hint'
    > &
        Partial<
            Pick<
                PublicApplicationFormField,
                | 'options'
                | 'optionSource'
                | 'placeholder'
                | 'hint'
                | 'extras'
            >
        >,
): PublicApplicationFormField {
    return {
        stepId: PUBLIC_APPLICATION_STEP_ID,
        sectionId: PUBLIC_APPLICATION_SECTION_ID,
        enabled: true,
        optionSource: partial.optionSource ?? 'static',
        options: partial.options ?? [],
        placeholder: partial.placeholder ?? null,
        hint: partial.hint ?? null,
        col: null,
        span: null,
        row: null,
        spanLocked: false,
        extras: partial.extras ?? {},
        key: partial.key,
        label: partial.label,
        widget: partial.widget,
        order: partial.order,
        required: partial.required,
    };
}

const PUBLIC_APPLICATION_FORM_STRUCTURE: PublicApplicationFormStructure = {
    steps: [
        {
            id: PUBLIC_APPLICATION_STEP_ID,
            title: 'Application',
            hint: null,
            order: 0,
        },
    ],
    sections: [
        {
            id: PUBLIC_APPLICATION_SECTION_ID,
            stepId: PUBLIC_APPLICATION_STEP_ID,
            title: 'Candidate details',
            hint: 'Apply to an Open internship opening',
            order: 0,
        },
    ],
    fields: [
        field({
            key: 'opening_id',
            label: 'Job opening',
            widget: 'select',
            order: 0,
            required: true,
            optionSource: 'hiring.openings.open',
            hint: 'Only currently Open openings accept applications',
            extras: { valueSource: 'GET /hiring/openings' },
        }),
        field({
            key: 'name',
            label: 'Full name',
            widget: 'text',
            order: 1,
            required: true,
        }),
        field({
            key: 'email',
            label: 'Email',
            widget: 'text',
            order: 2,
            required: true,
        }),
        field({
            key: 'college',
            label: 'College',
            widget: 'text',
            order: 3,
            required: true,
        }),
        field({
            key: 'degree',
            label: 'Degree',
            widget: 'text',
            order: 4,
            required: true,
        }),
        field({
            key: 'graduation_year',
            label: 'Graduation year',
            widget: 'number',
            order: 5,
            required: true,
            hint: 'Must be between 2020 and 2035',
        }),
        field({
            key: 'source',
            label: 'How did you hear about us?',
            widget: 'select',
            order: 6,
            required: true,
            options: SOURCES.map((source) => ({
                id: source,
                label: source,
            })),
        }),
        field({
            key: 'resume_link',
            label: 'Resume link',
            widget: 'text',
            order: 7,
            required: true,
            placeholder: 'https://…',
        }),
    ],
};

const PUBLIC_APPLICATION_FORM_CONFIG: PublicApplicationFormConfig = {
    key: PUBLIC_APPLICATION_FORM_KEY,
    locationId: PUBLIC_APPLICATION_LOCATION_ID,
    title: PUBLIC_APPLICATION_FORM_TITLE,
    description:
        'Public careers application. Submit answers to POST /hiring/apply.',
    kind: PUBLIC_APPLICATION_FORM_KIND,
    brandImage: PUBLIC_APPLICATION_BRAND_IMAGE,
    brandDetailRequired: false,
    status: 'published',
    version: 1,
    structure: PUBLIC_APPLICATION_FORM_STRUCTURE,
    fieldKeys: PUBLIC_APPLICATION_FIELD_KEYS,
};

/**
 * Forms host seed shape (snake_case write schema) for optional studio bootstrap.
 * Capture/submit is still {@link PublicApplyService} — not `@vyapti/forms`.
 */
const PUBLIC_APPLICATION_FORM_HTTP_SEED = {
    form_key: PUBLIC_APPLICATION_FORM_CONFIG.key,
    title: PUBLIC_APPLICATION_FORM_CONFIG.title,
    description: PUBLIC_APPLICATION_FORM_CONFIG.description,
    brand_image: PUBLIC_APPLICATION_FORM_CONFIG.brandImage,
    brand_detail_required: PUBLIC_APPLICATION_FORM_CONFIG.brandDetailRequired,
    kind: PUBLIC_APPLICATION_FORM_CONFIG.kind,
    status: 'draft',
    version: 1,
    steps: PUBLIC_APPLICATION_FORM_CONFIG.structure.steps,
    sections: PUBLIC_APPLICATION_FORM_CONFIG.structure.sections,
    fields: PUBLIC_APPLICATION_FORM_CONFIG.structure.fields,
    location: {
        location_id: PUBLIC_APPLICATION_FORM_CONFIG.locationId,
        label: 'Careers — public apply',
        hint: 'Unauthenticated intern applications',
    },
} as const;

export {
    PUBLIC_APPLICATION_BRAND_IMAGE,
    PUBLIC_APPLICATION_FIELD_KEYS,
    PUBLIC_APPLICATION_FORM_CONFIG,
    PUBLIC_APPLICATION_FORM_HTTP_SEED,
    PUBLIC_APPLICATION_FORM_KEY,
    PUBLIC_APPLICATION_FORM_STRUCTURE,
    PUBLIC_APPLICATION_FORM_TITLE,
    PUBLIC_APPLICATION_LOCATION_ID,
};
export type {
    PublicApplicationFieldKey,
    PublicApplicationFormConfig,
    PublicApplicationFormField,
    PublicApplicationFormStructure,
};
