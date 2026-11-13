import { getEntityWithName } from '@vyapti/core';
import { DataSource } from 'typeorm';
import { stringifyFieldValue } from './stringify-field-value.util';

type FkDimensionMeta = {
    related_entity: string;
    display_field: string;
    pk_field: string;
};

type ModelFieldLike = {
    kind: string;
    options: Record<string, unknown>;
};

function findDisplayField(
    fields: Record<string, ModelFieldLike>,
): string | null {
    for (const [fieldName, field] of Object.entries(fields)) {
        if (field.kind === 'CharacterString') {
            return fieldName;
        }
    }

    return null;
}

function resolveFkDimensionMeta(args: {
    fieldName: string;
    field: ModelFieldLike;
    dataSource: DataSource;
}): FkDimensionMeta | null {
    if (args.field.kind !== 'FK') {
        return null;
    }

    const modelName = args.field.options.model_name;
    if (typeof modelName !== 'string' || modelName.length === 0) {
        return null;
    }

    const relatedModel = getEntityWithName(modelName, args.dataSource);
    const pkField = relatedModel.getPrimaryKeyFieldName();
    const displayField =
        findDisplayField(relatedModel.getModelFields()) ?? pkField;

    return {
        related_entity: modelName,
        display_field: displayField,
        pk_field: pkField,
    };
}

function resolveFkDimensionMetas(args: {
    modelFields: Record<string, ModelFieldLike>;
    dimensionFields: string[];
    dataSource: DataSource;
}): Record<string, Omit<FkDimensionMeta, 'pk_field'>> {
    const fkDimensions: Record<string, Omit<FkDimensionMeta, 'pk_field'>> = {};

    for (const dimensionField of args.dimensionFields) {
        const field = args.modelFields[dimensionField];
        if (!field) continue;

        const meta = resolveFkDimensionMeta({
            fieldName: dimensionField,
            field,
            dataSource: args.dataSource,
        });

        if (meta) {
            fkDimensions[dimensionField] = {
                related_entity: meta.related_entity,
                display_field: meta.display_field,
            };
        }
    }

    return fkDimensions;
}

async function buildFkLabelMap(args: {
    dataSource: DataSource;
    meta: FkDimensionMeta;
}): Promise<Map<string, string>> {
    const relatedModel = getEntityWithName(
        args.meta.related_entity,
        args.dataSource,
    );
    const rows = (await relatedModel.all()) as unknown as Record<
        string,
        unknown
    >[];
    const labelMap = new Map<string, string>();

    for (const row of rows) {
        const id = stringifyFieldValue(row[args.meta.pk_field], '');
        const label = stringifyFieldValue(row[args.meta.display_field], id);
        labelMap.set(id, label);
    }

    return labelMap;
}

function applyLabelMap(
    labels: string[],
    labelMap: Map<string, string>,
): string[] {
    return labels.map((label) => labelMap.get(label) ?? label);
}

export {
    applyLabelMap,
    buildFkLabelMap,
    resolveFkDimensionMeta,
    resolveFkDimensionMetas,
    type FkDimensionMeta,
};
