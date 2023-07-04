import { Component, EventEmitter, Output } from "@angular/core";
import { ParsedData } from "../../data-import/input-file/input-file.component";

/**
 * Import sub-step: Let user load a file and return parsed data.
 */
@Component({
  selector: "app-import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.scss"],
})
export class ImportFileComponent {
  @Output() dataLoaded = new EventEmitter<ParsedData<any>>();

  data: ParsedData<any>;

  onFileLoad($event: ParsedData<any>) {
    this.dataLoaded.emit($event);
    this.data = $event;
  }
}
