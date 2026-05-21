import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
  computed,
} from "@angular/core";
import {
  InputFileComponent,
  ParsedData,
} from "../../common-components/input-file/input-file.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";

/**
 * Import sub-step: Let user load a file and return parsed data.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.scss"],
  imports: [
    InputFileComponent,
    MatFormFieldModule,
    MatExpansionModule,
    FormsModule,
    HelpButtonComponent,
    BasicAutocompleteComponent,
  ],
})
export class ImportFileComponent {
  @Output() dataLoaded = new EventEmitter<ParsedData<any>>();

  data: ParsedData<any>;
  readonly selectedDelimiter = signal<string | undefined>(undefined);

  private readonly defaultSeparatorOptions: string[] = [",", ";", "|"];

  /**
   * Dropdown options: the project-supported defaults plus the
   * auto-detected delimiter if PapaParse picked something outside the
   * defaults (e.g. tab, ASCII control chars). This keeps the dropdown
   * in sync with the actual delimiter used to parse the file, so the
   * user always sees and can override the real value.
   */
  readonly separatorOptions = computed<string[]>(() => {
    const detected = this.selectedDelimiter();
    if (detected && !this.defaultSeparatorOptions.includes(detected)) {
      return [...this.defaultSeparatorOptions, detected];
    }
    return this.defaultSeparatorOptions;
  });

  @ViewChild(InputFileComponent) inputFileField: InputFileComponent;

  /**
   * Handle a freshly parsed file emitted by the input-file child.
   * Pre-selects the column-separator dropdown to the auto-detected
   * delimiter (which may be outside the defaults — the dropdown will
   * include it automatically via `separatorOptions`). Falls back to
   * comma only when nothing was detected.
   */
  onFileLoad(parsedData: ParsedData<any>) {
    this.data = parsedData;
    this.selectedDelimiter.set(parsedData.detectedDelimiter || ",");
    this.dataLoaded.emit(parsedData);
  }

  /**
   * Handle a user-driven change of the column-separator dropdown:
   * remember the choice and ask the input-file to re-parse the cached
   * file content with the new delimiter (which will re-emit `dataLoaded`).
   */
  onSeparatorChange(value: string | undefined) {
    if (!value || value === this.selectedDelimiter()) {
      return;
    }
    this.selectedDelimiter.set(value);
    this.inputFileField?.reparseWithDelimiter(value);
  }

  public reset() {
    delete this.data;
    this.selectedDelimiter.set(undefined);
    this.inputFileField.formControl.reset();
  }
}
