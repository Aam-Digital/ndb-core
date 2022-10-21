import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { readFile } from "../../../utils/utils";
import { Papa, ParseResult } from "ngx-papaparse";
import { FormControl } from "@angular/forms";

/**
 * Form Field to select and parse a file.
 *
 * Currently only supports CSV.
 */
@Component({
  selector: "app-input-file",
  templateUrl: "./input-file.component.html",
  styleUrls: ["./input-file.component.scss"],
})
export class InputFileComponent implements OnInit {
  /** returns parsed data on completing load after user selects a file */
  @Output() fileLoad = new EventEmitter<ParsedData>();

  @Input() fileType: "csv" | "json";

  parsedData: ParsedData;
  formControl = new FormControl();

  constructor(private papa: Papa) {}

  ngOnInit(): void {}

  async loadFile($event: Event): Promise<void> {
    this.formControl.reset();

    const file = this.getFileFromInputEvent($event);
    this.formControl.setValue(file.name);

    const fileErrors = this.detectFileValidationErrors(file);
    if (fileErrors) {
      this.formControl.setErrors(fileErrors);
      this.formControl.markAsTouched();
      return;
    }

    const fileContent = await readFile(file);
    this.parsedData = this.parseContent(fileContent);

    const parseErrors = this.detectParsingErrors(this.parsedData);
    if (parseErrors) {
      this.formControl.setErrors(parseErrors);
      this.formControl.markAsTouched();
      return;
    }

    this.fileLoad.emit(this.parsedData);
  }

  private parseContent(fileContent: string) {
    if (this.fileType === "csv") {
      return this.papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
    }
    if (this.fileType === "json") {
      return JSON.parse(fileContent);
    }
  }

  private detectFileValidationErrors(file: File): Object | void {
    if (!file.name.toLowerCase().endsWith("." + this.fileType)) {
      return { fileInvalid: `Only ${this.fileType} files are supported` };
    }
  }

  private detectParsingErrors(parsedData: ParseResult): Object | void {
    if (parsedData === undefined || parsedData.data === undefined) {
      return { parsingError: "File could not be parsed" };
    }
    if (parsedData.data.length === 0) {
      return { parsingError: "File has no content" };
    }
  }

  private getFileFromInputEvent(inputEvent: Event): File {
    const target = inputEvent.target as HTMLInputElement;
    return target.files[0];
  }
}

export type ParsedData = ParseResult;
