import {
    create_list_of_dict_from_list_of_strings,
    createListOfDictFromListOfStringsDefinition,
} from './functions/create_list_of_dict_from_list_of_strings.js';
import { multiply, multiplyDefinition } from './functions/multiply.js';
import {
    split_lines_from_text,
    splitLinesFromTextDefinition,
} from './functions/split_lines_from_text.js';
import {
    parse_file_content_to_records,
    parseFileContentToRecordsDefinition,
} from './functions/parse_file_content_to_records.js';
import {
    read_headerless_csv_text,
    readHeaderlessCsvTextDefinition,
} from './functions/read_headerless_csv_text.js';
import {
    split_lines_of_strings_on_characters,
    splitLinesOfStringsOnCharactersDefinition,
} from './functions/split_lines_of_strings_on_characters.js';
import {
    map_dict_list_on_key_value,
    mapDictListOnKeyValueDefinition,
} from './functions/map_dict_list_on_key_value.js';
import {
    normalize_fbi_crime_grid_csv,
    normalizeFbiCrimeGridCsvDefinition,
} from './functions/crime_csv_normalize_functions.js';
import {
    normalize_construction_spending_csv,
    normalize_cpi_grid_csv,
    normalize_gdp_grid_csv,
    normalizeConstructionSpendingCsvDefinition,
    normalizeCpiGridCsvDefinition,
    normalizeGdpGridCsvDefinition,
} from './functions/macro_csv_normalize_functions.js';
import {
    normalize_fhfa_county_hpi_csv,
    normalize_fhfa_hpi_csv,
    normalize_nyc_ctf_mortgage_csv,
    normalize_nyc_rolling_sales_csv,
    normalizeFhfaCountyHpiCsvDefinition,
    normalizeFhfaHpiCsvDefinition,
    normalizeNycCtfMortgageCsvDefinition,
    normalizeNycRollingSalesCsvDefinition,
} from './functions/us_dataset_normalize_functions.js';
import {
    add_constant_field,
    addConstantFieldDefinition,
    add_bbl_key_field,
    addBblKeyFieldDefinition,
    assign_ny_risk_peer_field,
    assignNyRiskPeerFieldDefinition,
    assign_ny_risk_borough_field,
    assignNyRiskBoroughFieldDefinition,
    add_macro_health_score_field,
    add_market_heat_score_field,
    add_market_heat_from_growth_bands,
    add_market_position_score_field,
    addMarketHeatScoreFieldDefinition,
    addMarketHeatFromGrowthBandsDefinition,
    addMarketPositionScoreFieldDefinition,
    scale_numeric_field,
    scaleNumericFieldDefinition,
    add_price_vs_avg_field,
    addPriceVsAvgFieldDefinition,
    add_risk_safety_score_field,
    addMacroHealthScoreFieldDefinition,
    mean_numeric_field,
    meanNumericFieldDefinition,
    addRiskSafetyScoreFieldDefinition,
    build_region_id,
    buildRegionIdDefinition,
    classify_by_thresholds,
    classifyByThresholdsDefinition,
    compute_ahp_weights,
    computeAhpWeightsDefinition,
    concat_records,
    concatRecordsDefinition,
    extract_regex_field,
    extractRegexFieldDefinition,
    fetch_entity_records,
    fetchEntityRecordsDefinition,
    fill_missing_fields,
    fillMissingFieldsDefinition,
    filter_records,
    filterRecordsDefinition,
    group_and_aggregate,
    groupAndAggregateDefinition,
    head_records,
    headRecordsDefinition,
    sample_records_across_zips,
    sampleRecordsAcrossZipsDefinition,
    map_field_values,
    mapFieldValuesDefinition,
    market_heat_score,
    marketHeatScoreDefinition,
    market_position_score,
    marketPositionScoreDefinition,
    merge_records,
    mergeRecordsDefinition,
    normalize_to_range,
    normalizeToRangeDefinition,
    parse_date_field,
    parse_noaa_damage_field,
    parseDateFieldDefinition,
    parseNoaaDamageFieldDefinition,
    price_vs_average,
    priceVsAverageDefinition,
    rename_fields,
    renameFieldsDefinition,
    risk_safety_score,
    riskSafetyScoreDefinition,
    select_fields,
    selectFieldsDefinition,
    strip_fields,
    stripFieldsDefinition,
    to_numeric_field,
    to_numeric_fields,
    toNumericFieldDefinition,
    toNumericFieldsDefinition,
    upper_field,
    upperFieldDefinition,
    weighted_sum,
    weightedSumDefinition,
} from './functions/investment_record_functions.js';
import type { FunctionDefinition, RegisteredFunction } from './types.js';

export type {
    FunctionAttributeDefinition,
    FunctionDefinition,
    FunctionReturnDefinition,
    RegisteredFunction,
} from './types.js';

export {
    create_list_of_dict_from_list_of_strings,
    createListOfDictFromListOfStringsDefinition,
    multiply,
    multiplyDefinition,
    parse_file_content_to_records,
    parseFileContentToRecordsDefinition,
    read_headerless_csv_text,
    readHeaderlessCsvTextDefinition,
    split_lines_from_text,
    splitLinesFromTextDefinition,
    split_lines_of_strings_on_characters,
    splitLinesOfStringsOnCharactersDefinition,
    map_dict_list_on_key_value,
    mapDictListOnKeyValueDefinition,
    normalize_fbi_crime_grid_csv,
    normalizeFbiCrimeGridCsvDefinition,
    normalize_construction_spending_csv,
    normalizeConstructionSpendingCsvDefinition,
    normalize_cpi_grid_csv,
    normalizeCpiGridCsvDefinition,
    normalize_gdp_grid_csv,
    normalizeGdpGridCsvDefinition,
    normalize_fhfa_county_hpi_csv,
    normalizeFhfaCountyHpiCsvDefinition,
    normalize_fhfa_hpi_csv,
    normalizeFhfaHpiCsvDefinition,
    normalize_nyc_ctf_mortgage_csv,
    normalizeNycCtfMortgageCsvDefinition,
    normalize_nyc_rolling_sales_csv,
    normalizeNycRollingSalesCsvDefinition,
    add_constant_field,
    addConstantFieldDefinition,
    add_bbl_key_field,
    addBblKeyFieldDefinition,
    assign_ny_risk_peer_field,
    assignNyRiskPeerFieldDefinition,
    assign_ny_risk_borough_field,
    assignNyRiskBoroughFieldDefinition,
    add_macro_health_score_field,
    addMacroHealthScoreFieldDefinition,
    add_market_heat_score_field,
    addMarketHeatScoreFieldDefinition,
    add_market_heat_from_growth_bands,
    addMarketHeatFromGrowthBandsDefinition,
    add_market_position_score_field,
    addMarketPositionScoreFieldDefinition,
    scale_numeric_field,
    scaleNumericFieldDefinition,
    add_price_vs_avg_field,
    addPriceVsAvgFieldDefinition,
    add_risk_safety_score_field,
    addRiskSafetyScoreFieldDefinition,
    mean_numeric_field,
    meanNumericFieldDefinition,
    build_region_id,
    buildRegionIdDefinition,
    classify_by_thresholds,
    classifyByThresholdsDefinition,
    compute_ahp_weights,
    computeAhpWeightsDefinition,
    concat_records,
    concatRecordsDefinition,
    extract_regex_field,
    extractRegexFieldDefinition,
    fetch_entity_records,
    fetchEntityRecordsDefinition,
    fill_missing_fields,
    fillMissingFieldsDefinition,
    filter_records,
    filterRecordsDefinition,
    group_and_aggregate,
    groupAndAggregateDefinition,
    head_records,
    headRecordsDefinition,
    sample_records_across_zips,
    sampleRecordsAcrossZipsDefinition,
    map_field_values,
    mapFieldValuesDefinition,
    market_heat_score,
    marketHeatScoreDefinition,
    market_position_score,
    marketPositionScoreDefinition,
    merge_records,
    mergeRecordsDefinition,
    normalize_to_range,
    normalizeToRangeDefinition,
    parse_date_field,
    parse_noaa_damage_field,
    parseDateFieldDefinition,
    parseNoaaDamageFieldDefinition,
    price_vs_average,
    priceVsAverageDefinition,
    rename_fields,
    renameFieldsDefinition,
    risk_safety_score,
    riskSafetyScoreDefinition,
    select_fields,
    selectFieldsDefinition,
    strip_fields,
    stripFieldsDefinition,
    to_numeric_field,
    to_numeric_fields,
    toNumericFieldDefinition,
    toNumericFieldsDefinition,
    upper_field,
    upperFieldDefinition,
    weighted_sum,
    weightedSumDefinition,
};

export const functionRegistry = {
    multiply: {
        definition: multiplyDefinition,
        execute: (args: Record<string, unknown>) =>
            multiply({
                a: Number(args.a),
                b: Number(args.b),
            }),
    },
    split_lines_from_text: {
        definition: splitLinesFromTextDefinition,
        execute: (args: Record<string, unknown>) =>
            split_lines_from_text({
                text: String(args.text),
            }),
    },
    split_lines_of_strings_on_characters: {
        definition: splitLinesOfStringsOnCharactersDefinition,
        execute: (args: Record<string, unknown>) =>
            split_lines_of_strings_on_characters({
                lines: args.lines as string[],
                characters: args.characters as string[],
            }),
    },
    create_list_of_dict_from_list_of_strings: {
        definition: createListOfDictFromListOfStringsDefinition,
        execute: (args: Record<string, unknown>) =>
            create_list_of_dict_from_list_of_strings({
                listOfStrings: args.listOfStrings as string[],
                key: String(args.key),
            }),
    },
    parse_file_content_to_records: {
        definition: parseFileContentToRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            parse_file_content_to_records({
                text: String(args.text),
                file: isRecord(args.file) ? args.file : {},
                fileMeta: isRecord(args.fileMeta) ? args.fileMeta : {},
                fields: args.fields as string[] | string | undefined,
            }),
    },
    normalize_construction_spending_csv: {
        definition: normalizeConstructionSpendingCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_construction_spending_csv({
                text: String(args.text),
            }),
    },
    normalize_gdp_grid_csv: {
        definition: normalizeGdpGridCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_gdp_grid_csv({
                text: String(args.text),
            }),
    },
    normalize_cpi_grid_csv: {
        definition: normalizeCpiGridCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_cpi_grid_csv({
                text: String(args.text),
            }),
    },
    normalize_fbi_crime_grid_csv: {
        definition: normalizeFbiCrimeGridCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_fbi_crime_grid_csv({
                text: String(args.text),
            }),
    },
    normalize_nyc_rolling_sales_csv: {
        definition: normalizeNycRollingSalesCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_nyc_rolling_sales_csv({
                text: String(args.text),
                borough_code:
                    typeof args.borough_code === 'string' ||
                    typeof args.borough_code === 'number'
                        ? String(args.borough_code)
                        : undefined,
            }),
    },
    normalize_fhfa_hpi_csv: {
        definition: normalizeFhfaHpiCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_fhfa_hpi_csv({
                text: String(args.text),
                place_name: args.place_name as string | undefined,
                filter_year: args.filter_year as string | undefined,
            }),
    },
    normalize_fhfa_county_hpi_csv: {
        definition: normalizeFhfaCountyHpiCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_fhfa_county_hpi_csv({
                text: String(args.text),
                filter_year: args.filter_year as string | undefined,
            }),
    },
    normalize_nyc_ctf_mortgage_csv: {
        definition: normalizeNycCtfMortgageCsvDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_nyc_ctf_mortgage_csv({
                text: String(args.text),
            }),
    },
    read_headerless_csv_text: {
        definition: readHeaderlessCsvTextDefinition,
        execute: (args: Record<string, unknown>) =>
            read_headerless_csv_text({
                text: String(args.text),
                headers: Array.isArray(args.headers)
                    ? args.headers.map(String)
                    : [],
            }),
    },
    map_dict_list_on_key_value: {
        definition: mapDictListOnKeyValueDefinition,
        execute: (args: Record<string, unknown>) =>
            map_dict_list_on_key_value({
                records: args.records as Record<string, unknown>[],
                field_mapping: String(args.field_mapping),
            }),
    },
    strip_fields: {
        definition: stripFieldsDefinition,
        execute: (args: Record<string, unknown>) =>
            strip_fields({
                records: args.records as Record<string, unknown>[],
                fields: args.fields as string[],
                chars: args.chars as string | undefined,
            }),
    },
    parse_date_field: {
        definition: parseDateFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            parse_date_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: args.output_field as string | undefined,
            }),
    },
    upper_field: {
        definition: upperFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            upper_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: args.output_field as string | undefined,
            }),
    },
    map_field_values: {
        definition: mapFieldValuesDefinition,
        execute: (args: Record<string, unknown>) =>
            map_field_values({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                mapping: args.mapping as Record<string, unknown> | string,
                fallback: args.fallback,
                output_field: args.output_field as string | undefined,
            }),
    },
    add_constant_field: {
        definition: addConstantFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_constant_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                value: args.value,
            }),
    },
    add_bbl_key_field: {
        definition: addBblKeyFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_bbl_key_field({
                records: args.records as Record<string, unknown>[],
                borough_field: args.borough_field as string | undefined,
                block_field: args.block_field as string | undefined,
                lot_field: args.lot_field as string | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    assign_ny_risk_peer_field: {
        definition: assignNyRiskPeerFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            assign_ny_risk_peer_field({
                records: args.records as Record<string, unknown>[],
                source: args.source as 'earthquake' | 'storm' | 'crime',
            }),
    },
    assign_ny_risk_borough_field: {
        definition: assignNyRiskBoroughFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            assign_ny_risk_borough_field({
                records: args.records as Record<string, unknown>[],
                source: args.source as 'earthquake' | 'storm',
            }),
    },
    select_fields: {
        definition: selectFieldsDefinition,
        execute: (args: Record<string, unknown>) =>
            select_fields({
                records: args.records as Record<string, unknown>[],
                fields: args.fields as string[],
            }),
    },
    rename_fields: {
        definition: renameFieldsDefinition,
        execute: (args: Record<string, unknown>) =>
            rename_fields({
                records: args.records as Record<string, unknown>[],
                mapping: args.mapping as Record<string, unknown> | string,
            }),
    },
    filter_records: {
        definition: filterRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            filter_records({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                value: args.value,
                op: args.op as string | undefined,
            }),
    },
    head_records: {
        definition: headRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            head_records({
                records: args.records as Record<string, unknown>[],
                limit: Number(args.limit),
            }),
    },
    sample_records_across_zips: {
        definition: sampleRecordsAcrossZipsDefinition,
        execute: (args: Record<string, unknown>) =>
            sample_records_across_zips({
                records: args.records as Record<string, unknown>[],
                limit: Number(args.limit),
                zip_field: args.zip_field as string | undefined,
            }),
    },
    concat_records: {
        definition: concatRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            concat_records({
                record_sets: args.record_sets as unknown[],
            }),
    },
    extract_regex_field: {
        definition: extractRegexFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            extract_regex_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                pattern: String(args.pattern),
                output_field: String(args.output_field),
            }),
    },
    fetch_entity_records: {
        definition: fetchEntityRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            fetch_entity_records({
                entity_name: String(args.entity_name),
                dataSource: args.dataSource as import('typeorm').DataSource,
                limit:
                    args.limit === undefined || args.limit === null
                        ? undefined
                        : Number(args.limit),
            }),
    },
    to_numeric_field: {
        definition: toNumericFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            to_numeric_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: args.output_field as string | undefined,
                default_value: Number(args.default_value ?? 0),
            }),
    },
    to_numeric_fields: {
        definition: toNumericFieldsDefinition,
        execute: (args: Record<string, unknown>) =>
            to_numeric_fields({
                records: args.records as Record<string, unknown>[],
                fields: args.fields as string[],
                default_value: Number(args.default_value ?? 0),
            }),
    },
    group_and_aggregate: {
        definition: groupAndAggregateDefinition,
        execute: (args: Record<string, unknown>) =>
            group_and_aggregate({
                records: args.records as Record<string, unknown>[],
                by: String(args.by),
                aggs: args.aggs as Record<string, unknown> | string,
            }),
    },
    merge_records: {
        definition: mergeRecordsDefinition,
        execute: (args: Record<string, unknown>) =>
            merge_records({
                left: args.left as Record<string, unknown>[],
                right: args.right as Record<string, unknown>[],
                left_key: String(args.left_key),
                right_key: args.right_key as string | undefined,
            }),
    },
    fill_missing_fields: {
        definition: fillMissingFieldsDefinition,
        execute: (args: Record<string, unknown>) =>
            fill_missing_fields({
                records: args.records as Record<string, unknown>[],
                fields: args.fields as string[],
                value: args.value,
            }),
    },
    normalize_to_range: {
        definition: normalizeToRangeDefinition,
        execute: (args: Record<string, unknown>) =>
            normalize_to_range({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: String(args.output_field),
                minimum: Number(args.minimum ?? 1),
                maximum: Number(args.maximum ?? 10),
            }),
    },
    weighted_sum: {
        definition: weightedSumDefinition,
        execute: (args: Record<string, unknown>) =>
            weighted_sum({
                records: args.records as Record<string, unknown>[],
                output_field: String(args.output_field),
                fields: args.fields as string[] | string,
                weights: args.weights as number[] | string,
            }),
    },
    classify_by_thresholds: {
        definition: classifyByThresholdsDefinition,
        execute: (args: Record<string, unknown>) =>
            classify_by_thresholds({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: String(args.output_field),
                thresholds: args.thresholds as Array<[number, string]> | string,
                default_label: String(args.default_label),
            }),
    },
    compute_ahp_weights: {
        definition: computeAhpWeightsDefinition,
        execute: (args: Record<string, unknown>) =>
            compute_ahp_weights({
                pairwise: args.pairwise as number[][] | string,
            }),
    },
    price_vs_average: {
        definition: priceVsAverageDefinition,
        execute: (args: Record<string, unknown>) =>
            price_vs_average({
                record: args.record as Record<string, unknown>,
                price_field: String(args.price_field),
                average_price: Number(args.average_price),
            }),
    },
    market_heat_score: {
        definition: marketHeatScoreDefinition,
        execute: (args: Record<string, unknown>) =>
            market_heat_score({
                yoy_change_pct: Number(args.yoy_change_pct ?? 0),
            }),
    },
    add_market_heat_score_field: {
        definition: addMarketHeatScoreFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_market_heat_score_field({
                records: args.records as Record<string, unknown>[],
                yoy_field: args.yoy_field as string | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    add_market_heat_from_growth_bands: {
        definition: addMarketHeatFromGrowthBandsDefinition,
        execute: (args: Record<string, unknown>) =>
            add_market_heat_from_growth_bands({
                records: args.records as Record<string, unknown>[],
                growth_field: args.growth_field as string | undefined,
                output_field: args.output_field as string | undefined,
                bands: args.bands,
            }),
    },
    add_market_position_score_field: {
        definition: addMarketPositionScoreFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_market_position_score_field({
                records: args.records as Record<string, unknown>[],
                price_field: args.price_field as string | undefined,
                average_price_field: args.average_price_field as
                    | string
                    | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    scale_numeric_field: {
        definition: scaleNumericFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            scale_numeric_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                divisor: Number(args.divisor),
                output_field: args.output_field as string | undefined,
                decimals:
                    args.decimals === undefined || args.decimals === null
                        ? undefined
                        : Number(args.decimals),
            }),
    },
    mean_numeric_field: {
        definition: meanNumericFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            mean_numeric_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                decimals:
                    args.decimals === undefined || args.decimals === null
                        ? undefined
                        : Number(args.decimals),
            }),
    },
    add_price_vs_avg_field: {
        definition: addPriceVsAvgFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_price_vs_avg_field({
                records: args.records as Record<string, unknown>[],
                price_field: args.price_field as string | undefined,
                average_price_field: args.average_price_field as
                    | string
                    | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    market_position_score: {
        definition: marketPositionScoreDefinition,
        execute: (args: Record<string, unknown>) =>
            market_position_score({
                record: args.record as Record<string, unknown>,
                price_field: String(args.price_field),
                average_price: Number(args.average_price),
            }),
    },
    risk_safety_score: {
        definition: riskSafetyScoreDefinition,
        execute: (args: Record<string, unknown>) =>
            risk_safety_score({
                record: args.record as Record<string, unknown>,
                risk_field: args.risk_field as string | undefined,
            }),
    },
    add_risk_safety_score_field: {
        definition: addRiskSafetyScoreFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_risk_safety_score_field({
                records: args.records as Record<string, unknown>[],
                risk_field: args.risk_field as string | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    add_macro_health_score_field: {
        definition: addMacroHealthScoreFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            add_macro_health_score_field({
                records: args.records as Record<string, unknown>[],
                macro_field: args.macro_field as string | undefined,
                output_field: args.output_field as string | undefined,
            }),
    },
    build_region_id: {
        definition: buildRegionIdDefinition,
        execute: (args: Record<string, unknown>) =>
            build_region_id({
                country: String(args.country),
                region: String(args.region),
            }),
    },
    parse_noaa_damage_field: {
        definition: parseNoaaDamageFieldDefinition,
        execute: (args: Record<string, unknown>) =>
            parse_noaa_damage_field({
                records: args.records as Record<string, unknown>[],
                field: String(args.field),
                output_field: String(args.output_field),
            }),
    },
} satisfies Record<string, RegisteredFunction>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const functionDefinitions: FunctionDefinition[] = Object.values(
    functionRegistry,
).map((entry) => entry.definition);
