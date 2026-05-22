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

export type SupportedFileType = "csv" | "json" | "xlsx";

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

/**
 * Form Field to select and parse a file.
 *
 * Supports CSV, JSON and XLSX. For multi-sheet XLSX workbooks an inline
 * sheet selector is shown and the chosen sheet's data is re-emitted on change.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-input-file",
  templateUrl: "./input-file.component.html",
  styleUrls: ["./input-file.component.scss"],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    FontAwesomeModule,
    BasicAutocompleteComponent,
  ],
})
export class InputFileComponent<T = any> {
  private papa = inject(Papa);

  /** returns parsed data as an object on completing load after user selects a file */
  fileLoad = output<ParsedData<T>>();

  fileType = input<SupportedFileType[]>(["csv"]);

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

  isOutlierSheet(sheet: SheetInfo): boolean {
    return sheet.columnCount < 2;
  }

  readonly sheetToLabel = (sheet: SheetInfo) => sheet?.name;
  readonly sheetToValue = (sheet: SheetInfo) => sheet?.name;

  async onSheetChange(sheetName: string): Promise<void> {
    if (!this.currentWorkbook) return;
    const sheet = this.currentWorkbook.getWorksheet(sheetName);
    if (!sheet) return;

    this.selectedSheet.set(sheetName);
    this.parsedData = this.worksheetToParsedData(sheet);
    this.fileLoad.emit(this.parsedData);
  }

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
        fileInvalid: `Only ${allowedTypes.join(", ")} files are supported`,
      };
    }
    return file;
  }

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

    if (!result) {
      throw { parsingError: "File could not be parsed" };
    }
    if (!result.data || result.data["length"] === 0) {
      throw { parsingError: "File has no content" };
    }
    result.filename = file.name;
    return result;
  }

  private parseCsv(fileContent: string): ParsedData<T> {
    const papaParsed = this.papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    if (!papaParsed) return undefined;
    return { data: papaParsed.data, fields: papaParsed.meta.fields };
  }

  private parseJson(fileContent: string): ParsedData<T> {
    return { data: JSON.parse(fileContent) };
  }

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

  private worksheetToParsedData(sheet: Worksheet): ParsedData<T> {
    const headerRow = sheet.getRow(1);
    const fields: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      fields.push(String(cell.value ?? "").trim());
    });

    const data: any[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, any> = {};
      fields.forEach((field, idx) => {
        const cellValue = row.getCell(idx + 1).value;
        record[field] = normalizeCellValue(cellValue);
      });
      data.push(record);
    });

    return { data: data as unknown as T, fields };
  }
}

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
