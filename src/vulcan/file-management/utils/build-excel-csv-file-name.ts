function sanitizeSheetFileToken(value: string): string {
    return value.replace(/[^\w.-]+/g, '_');
}

function buildExcelCsvFileName(
    workbookFileName: string,
    sheetName: string,
): string {
    const stem = workbookFileName.replace(/\.[^.]+$/, '');
    return `${stem}__${sanitizeSheetFileToken(sheetName)}.csv`;
}

export { buildExcelCsvFileName, sanitizeSheetFileToken };
