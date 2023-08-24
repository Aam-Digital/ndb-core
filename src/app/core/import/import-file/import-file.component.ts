import { Component, EventEmitter, Output, ViewChild } from "@angular/core";
import {
  InputFileComponent,
  ParsedData,
} from "../../common-components/input-file/input-file.component";
import { NgIf } from "@angular/common";

/**
 * Import sub-step: Let user load a file and return parsed data.
 */
@Component({
  selector: "app-import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.scss"],
  standalone: true,
  imports: [InputFileComponent, NgIf],
})
export class ImportFileComponent {
  @Output() dataLoaded = new EventEmitter<ParsedData<any>>();

  data: ParsedData<any>;
  @ViewChild(InputFileComponent) inputFileField: InputFileComponent;

  onFileLoad(parsedData: ParsedData<any>) {
    this.dataLoaded.emit(parsedData);
    this.data = parsedData;
  }

  public reset() {
    delete this.data;
    this.inputFileField.formControl.reset();
  }
}
