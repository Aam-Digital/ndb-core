import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  ParsedFileInputComponent,
  ParsedData,
} from "../../common-components/parsed-file-input/parsed-file-input.component";

/**
 * Import sub-step: Let user load a file and return parsed data.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.scss"],
  imports: [ParsedFileInputComponent],
})
export class ImportFileComponent {
  @Output() dataLoaded = new EventEmitter<ParsedData<any>>();

  data: ParsedData<any>;
  @ViewChild(ParsedFileInputComponent)
  parsedFileInputField: ParsedFileInputComponent;

  onFileLoad(parsedData: ParsedData<any>) {
    this.dataLoaded.emit(parsedData);
    this.data = parsedData;
  }

  public reset() {
    delete this.data;
    this.parsedFileInputField.formControl.reset();
  }
}
