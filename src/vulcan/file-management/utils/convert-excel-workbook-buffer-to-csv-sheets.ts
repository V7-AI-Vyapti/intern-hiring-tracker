import * as XLSX from 'xlsx';

type ExcelCsvSheet = {
    sheetName: string;
    csvText: string;
};

function convertExcelWorkbookBufferToCsvSheets(
    excelBuffer: Buffer,
): ExcelCsvSheet[] {
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });

    return workbook.SheetNames.map((sheetName) => ({
        sheetName,
        csvText: XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]),
    }));
}

export { convertExcelWorkbookBufferToCsvSheets, type ExcelCsvSheet };
