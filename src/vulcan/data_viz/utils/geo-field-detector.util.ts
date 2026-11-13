const LAT_PATTERN = /(^|_)(lat|latitude)$/i;
const LON_PATTERN = /(^|_)(lon|lng|longitude)$/i;

type GeoFieldPair = {
    lat_field: string;
    lon_field: string;
};

type DetectableField = {
    field_name: string;
    kind: string;
};

function detectGeoPair(fields: DetectableField[]): GeoFieldPair | null {
    const decimalFields = fields
        .filter((field) => field.kind === 'Decimal')
        .map((field) => field.field_name);

    const latField = decimalFields.find((field) => LAT_PATTERN.test(field));
    const lonField = decimalFields.find((field) => LON_PATTERN.test(field));

    if (latField && lonField) {
        return { lat_field: latField, lon_field: lonField };
    }

    return null;
}

function detectGeoPairFromModelFields(
    fields: Record<string, { kind: string }>,
): GeoFieldPair | null {
    const fieldList = Object.entries(fields).map(([field_name, field]) => ({
        field_name,
        kind: field.kind,
    }));

    return detectGeoPair(fieldList);
}

export {
    detectGeoPair,
    detectGeoPairFromModelFields,
    type DetectableField,
    type GeoFieldPair,
};
