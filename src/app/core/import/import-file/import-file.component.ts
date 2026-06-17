import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  model,
} from "@angular/core";
import {
  ParsedFileInputComponent,
  ParsedData,
} from "../../common-components/parsed-file-input/parsed-file-input.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { ImportAdditionalSettings } from "../import-additional-settings";

/**
 * Import sub-step: Let user load a file and return parsed data.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.scss"],
  imports: [
    ParsedFileInputComponent,
    MatFormFieldModule,
    MatExpansionModule,
    MatCheckboxModule,
    FormsModule,
    HelpButtonComponent,
    BasicAutocompleteComponent,
  ],
})
export class ImportFileComponent {
  entityType = input<string>();
  additionalSettings = model<ImportAdditionalSettings>({});

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

  @ViewChild(ParsedFileInputComponent)
  parsedFileInputField: ParsedFileInputComponent;

  readonly multiValueSeparatorOptions: string[] = [",", ";"];

  get multiValueSeparator(): string {
    return this.additionalSettings()?.multiValueSeparator ?? ",";
  }

  set multiValueSeparator(value: string) {
    this.additionalSettings.update((settings) => ({
      ...settings,
      multiValueSeparator: value,
    }));
  }

  get trimValues(): boolean {
    return this.additionalSettings()?.trimValues !== false;
  }

  set trimValues(value: boolean) {
    this.additionalSettings.update((settings) => ({
      ...settings,
      trimValues: value,
    }));
  }

  createCustomSeparator = async (input: string) => input;

  /**
   * Handle a freshly parsed file emitted by the parsed-file-input child.
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
   * remember the choice and ask the parsed-file-input to re-parse the cached
   * file content with the new delimiter (which will re-emit `dataLoaded`).
   */
  onSeparatorChange(value: string | undefined) {
    if (!value || value === this.selectedDelimiter()) {
      return;
    }
    this.selectedDelimiter.set(value);
    this.parsedFileInputField?.reparseWithDelimiter(value);
  }

  public reset() {
    delete this.data;
    this.selectedDelimiter.set(undefined);
    this.parsedFileInputField.formControl.reset();
  }
}
