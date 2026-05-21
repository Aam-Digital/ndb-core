import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { readFile } from "../../../utils/utils";
import { Papa } from "ngx-papaparse";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Form Field to select and parse a file.
 *
 * Currently only supports CSV.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-input-file",
  templateUrl: "./input-file.component.html",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    FontAwesomeModule,
  ],
})
export class InputFileComponent<T = any> {
  private papa = inject(Papa);

  /** returns parsed data as an object on completing load after user selects a file */
  fileLoad = output<ParsedData<T>>();

  fileType = input<"csv" | "json">();

  parsedData: ParsedData<T>;
  formControl = new FormControl();

  private lastFileContent?: string;
  private lastFilename?: string;

  async loadFile($event: Event): Promise<void> {
    this.formControl.reset();

    try {
      const file = this.getFileFromInputEvent($event, this.fileType());
      this.formControl.setValue(file.name);

      const fileContent = await readFile(file);
      this.lastFileContent = fileContent;
      this.lastFilename = file.name;
      this.parsedData = this.parseContent(fileContent, file.name);

      this.fileLoad.emit(this.parsedData);
    } catch (errors) {
      this.formControl.setErrors(errors);
      this.formControl.markAsTouched();
    }
  }

  /**
   * Re-parse the previously loaded CSV file using the given delimiter and
   * re-emit `fileLoad`. Useful when PapaParse's auto-detection picked the
   * wrong column separator and the user manually overrides it, without
   * forcing them to re-upload the file.
   *
   * No-op when no file has been loaded yet or `fileType` is not `csv`.
   *
   * @param delimiter the column delimiter to parse the cached file content with
   */
  reparseWithDelimiter(delimiter: string): void {
    if (this.lastFileContent === undefined || this.fileType() !== "csv") {
      return;
    }
    try {
      this.parsedData = this.parseContent(
        this.lastFileContent,
        this.lastFilename,
        delimiter,
      );
      this.formControl.setErrors(null);
      this.fileLoad.emit(this.parsedData);
    } catch (errors) {
      this.formControl.setErrors(errors);
      this.formControl.markAsTouched();
    }
  }

  private getFileFromInputEvent(
    inputEvent: Event,
    allowedFileType?: string,
  ): File {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];

    if (
      allowedFileType &&
      !file.name.toLowerCase().endsWith("." + allowedFileType)
    ) {
      throw { fileInvalid: `Only ${this.fileType()} files are supported` };
    }

    return file;
  }

  private parseContent(
    fileContent: string,
    filename?: string,
    explicitDelimiter?: string,
  ) {
    let result;

    if (this.fileType() === "csv") {
      const papaConfig: {
        header: boolean;
        dynamicTyping: boolean;
        skipEmptyLines: boolean;
        delimiter?: string;
      } = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      };
      if (explicitDelimiter !== undefined) {
        papaConfig.delimiter = explicitDelimiter;
      }
      const papaParsed = this.papa.parse(fileContent, papaConfig);
      result = {
        data: papaParsed.data,
        fields: papaParsed.meta.fields,
        detectedDelimiter: papaParsed.meta.delimiter,
      };
    } else if (this.fileType() === "json") {
      result = { data: JSON.parse(fileContent) };
    }

    if (result === undefined) {
      throw { parsingError: "File could not be parsed" };
    }
    if (result.data.length === 0) {
      throw { parsingError: "File has no content" };
    }
    result.filename = filename;
    return result;
  }
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

  /** the CSV column delimiter that was used (auto-detected by PapaParse or explicitly chosen) */
  detectedDelimiter?: string;
}
