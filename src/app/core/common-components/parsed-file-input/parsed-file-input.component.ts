import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { readFile, readFileAsArrayBuffer } from "../../../utils/utils";
import { Papa } from "ngx-papaparse";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Workbook, Worksheet } from "exceljs";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";

/** File extensions accepted by the parsed-file input component. */
export type SupportedFileType = "csv" | "json" | "xlsx";

/**
 * Lightweight description of a worksheet inside a loaded xlsx workbook,
 * used to populate the inline sheet picker for multi-sheet files.
 */
export interface SheetInfo {
  /** Worksheet name as shown to the user in the picker. */
  name: string;
  /** Data row count, excluding the header row. */
  rowCount: number;
  /** Number of populated columns in the worksheet. */
  columnCount: number;
}

/**
 * Form field to select and parse a structured data file.
 *
 * Supports CSV, JSON and XLSX. For multi-sheet XLSX workbooks an inline
 * sheet selector is shown and the chosen sheet's data is re-emitted on change.
 * Attachment uploads use the file datatype components instead.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-parsed-file-input",
  templateUrl: "./parsed-file-input.component.html",
  styleUrls: ["./parsed-file-input.component.scss"],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    FontAwesomeModule,
    BasicAutocompleteComponent,
  ],
})
export class ParsedFileInputComponent<T = any> {
  private papa = inject(Papa);

  /** returns parsed data as an object on completing load after user selects a file */
  fileLoad = output<ParsedData<T>>();

  /**
   * Allowed file types. Accepts a single value (legacy) or an array.
   * String input is normalized to a single-element array.
   */
  fileType = input<
    SupportedFileType[],
    SupportedFileType | SupportedFileType[]
  >(["csv"], {
    transform: (value) => (Array.isArray(value) ? value : [value]),
  });

  /** Sheets available in the currently loaded xlsx workbook (empty otherwise). */
  readonly availableSheets = signal<SheetInfo[]>([]);
  readonly selectedSheet = signal<string | null>(null);

  /** Comma-separated list of extensions for the file input `accept` attribute. */
  readonly acceptAttribute = computed(() =>
    this.fileType()
      .map((t) => "." + t)
      .join(","),
  );

  parsedData: ParsedData<T>;
  formControl = new FormControl();

  private currentWorkbook: Workbook | null = null;

  async loadFile($event: Event): Promise<void> {
    this.formControl.reset();
    this.resetSheetState();

    try {
      const file = this.getFileFromInputEvent($event);
      this.formControl.setValue(file.name);

      this.parsedData = await this.parseFile(file);
      this.fileLoad.emit(this.parsedData);
    } catch (errors) {
      this.formControl.setErrors(errors);
      this.formControl.markAsTouched();
    }
  }

  /** Display string for a sheet option in the inline picker. */
  readonly sheetToLabel = (sheet: SheetInfo) => sheet?.name;

  /** Form value for a sheet option in the inline picker. */
  readonly sheetToValue = (sheet: SheetInfo) => sheet?.name;

  /**
   * Re-parse the currently loaded workbook using the chosen sheet
   * and re-emit `fileLoad` with the new data. No-op for non-xlsx files
   * or when the workbook has been cleared.
   *
   * Accepts `string | string[]` to align with the autocomplete's `valueChange`
   * typing; only single-select is wired, so an array is normalized to its first element.
   */
  async onSheetChange(value: string | string[]): Promise<void> {
    const sheetName = Array.isArray(value) ? value[0] : value;
    if (!sheetName) return;
    if (!this.currentWorkbook) return;
    const sheet = this.currentWorkbook.getWorksheet(sheetName);
    if (!sheet) return;

    try {
      const nextParsedData = this.finalizeParsedData(
        this.worksheetToParsedData(sheet),
        this.parsedData?.filename,
      );
      this.formControl.setErrors(null);
      this.selectedSheet.set(sheetName);
      this.parsedData = nextParsedData;
      this.fileLoad.emit(this.parsedData);
    } catch (errors) {
      this.formControl.setErrors(errors);
      this.formControl.markAsTouched();
    }
  }

  /** Clears the picker state and the cached workbook reference. */
  private resetSheetState(): void {
    this.availableSheets.set([]);
    this.selectedSheet.set(null);
    this.currentWorkbook = null;
  }

  private getFileFromInputEvent(inputEvent: Event): File {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];

    const allowedTypes = this.fileType();
    const matchedType = allowedTypes.find((t) =>
      file.name.toLowerCase().endsWith("." + t),
    );
    if (!matchedType) {
      throw {
        fileInvalid: $localize`:Invalid file type error:Only ${allowedTypes.join(
          ", ",
        )}:fileTypes: files are supported`,
      };
    }
    return file;
  }

  /**
   * Dispatches to the right parser based on the file extension and validates
   * that the result is non-empty before returning it.
   *
   * @throws `{ parsingError: string }` when the file cannot be parsed or has no rows.
   */
  private async parseFile(file: File): Promise<ParsedData<T>> {
    const lowerName = file.name.toLowerCase();

    let result: ParsedData<T>;
    if (lowerName.endsWith(".csv")) {
      result = this.parseCsv(await readFile(file));
    } else if (lowerName.endsWith(".json")) {
      result = this.parseJson(await readFile(file));
    } else if (lowerName.endsWith(".xlsx")) {
      result = await this.parseXlsx(await readFileAsArrayBuffer(file));
    }

    return this.finalizeParsedData(result, file.name);
  }

  private finalizeParsedData(
    result: ParsedData<T>,
    filename?: string,
  ): ParsedData<T> {
    if (!result) {
      throw {
        parsingError: $localize`:File parsing error:File could not be parsed`,
      };
    }
    if (!result.data || (result.data as { length?: number }).length === 0) {
      throw {
        parsingError: $localize`:Empty file parsing error:File has no content`,
      };
    }
    result.filename = filename;
    return result;
  }

  /** Parses CSV text via ngx-papaparse using the first row as headers. */
  private parseCsv(fileContent: string): ParsedData<T> {
    const papaParsed = this.papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    if (!papaParsed) return undefined;
    return { data: papaParsed.data, fields: papaParsed.meta.fields };
  }

  /** Parses JSON text directly with `JSON.parse`. */
  private parseJson(fileContent: string): ParsedData<T> {
    return { data: JSON.parse(fileContent) };
  }

  /**
   * Loads an xlsx workbook via exceljs, caches it for sheet switching, and
   * returns the first sheet as `ParsedData`. When the workbook has more than
   * one sheet, `availableSheets` is populated so the picker is shown.
   */
  private async parseXlsx(buffer: ArrayBuffer): Promise<ParsedData<T>> {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    this.currentWorkbook = workbook;

    const sheets = workbook.worksheets;
    if (sheets.length === 0) return undefined;

    if (sheets.length > 1) {
      this.availableSheets.set(
        sheets.map((s) => ({
          name: s.name,
          rowCount: Math.max(0, s.actualRowCount - 1),
          columnCount: s.actualColumnCount,
        })),
      );
    }
    this.selectedSheet.set(sheets[0].name);

    return this.worksheetToParsedData(sheets[0]);
  }

  /**
   * Converts an exceljs `Worksheet` into the same `ParsedData` shape that the
   * CSV path produces: row 1 is treated as the header and subsequent rows
   * become objects keyed by header name.
   *
   * Tracks each header's actual column index so empty header cells don't
   * desynchronize the lookup when reading data rows.
   */
  private worksheetToParsedData(sheet: Worksheet): ParsedData<T> {
    const headerRow = sheet.getRow(1);
    const fields: string[] = [];
    const columnIndices: number[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      fields.push(String(cell.value ?? "").trim());
      columnIndices.push(colNumber);
    });

    const data: any[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, any> = {};
      fields.forEach((field, idx) => {
        const cellValue = row.getCell(columnIndices[idx]).value;
        record[field] = normalizeCellValue(cellValue);
      });
      data.push(record);
    });

    return { data: data as unknown as T, fields };
  }
}

/**
 * Unwraps exceljs's rich cell value shapes (e.g. hyperlinks expose `text`,
 * formulas expose `result`) into a primitive suitable for the import flow.
 */
function normalizeCellValue(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "object" && "text" in (value as any)) {
    return (value as { text: string }).text;
  }
  if (typeof value === "object" && "result" in (value as any)) {
    return (value as { result: unknown }).result;
  }
  return value;
}

/**
 * Results and (optional) meta data about data parsed from a file.
 */
export interface ParsedData<T = any[]> {
  /** object or array of objects parsed from a file */
  data: T;

  /** meta information listing the fields contained in data objects */
  fields?: string[];
  filename?: string;
}
