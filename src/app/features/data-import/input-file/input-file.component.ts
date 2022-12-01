import { Component, EventEmitter, Input, Output } from "@angular/core";
import { readFile } from "../../../utils/utils";
import { Papa } from "ngx-papaparse";
import { FormControl } from "@angular/forms";

/**
 * Form Field to select and parse a file.
 *
 * Currently only supports CSV.
 */
@Component({
  selector: "app-input-file",
  templateUrl: "./input-file.component.html",
})
export class InputFileComponent<T = any> {
  /** returns parsed data as an object on completing load after user selects a file */
  @Output() fileLoad = new EventEmitter<ParsedData<T>>();

  @Input() fileType: "csv" | "json";

  parsedData: ParsedData<T>;
  formControl = new FormControl();

  constructor(private papa: Papa) {}

  async loadFile($event: Event): Promise<void> {
    this.formControl.reset();

    try {
      const file = this.getFileFromInputEvent($event, this.fileType);
      this.formControl.setValue(file.name);

      const fileContent = await readFile(file);
      this.parsedData = this.parseContent(fileContent);

      this.fileLoad.emit(this.parsedData);
    } catch (errors) {
      this.formControl.setErrors(errors);
      this.formControl.markAsTouched();
    }
  }

  private getFileFromInputEvent(
    inputEvent: Event,
    allowedFileType?: string
  ): File {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];

    if (
      allowedFileType &&
      !file.name.toLowerCase().endsWith("." + allowedFileType)
    ) {
      throw { fileInvalid: `Only ${this.fileType} files are supported` };
    }

    return file;
  }

  private parseContent(fileContent: string) {
    let result;

    if (this.fileType === "csv") {
      const papaParsed = this.papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      result = { data: papaParsed.data, fields: papaParsed.meta.fields };
    } else if (this.fileType === "json") {
      result = { data: JSON.parse(fileContent) };
    }

    if (result === undefined) {
      throw { parsingError: "File could not be parsed" };
    }
    if (result.data.length === 0) {
      throw { parsingError: "File has no content" };
    }

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
}
