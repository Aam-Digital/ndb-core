import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

export interface ImportAdditionalSettings {
  multiValueSeparator?: string;
}

/**
 * Import sub-step: Let user configure additional import settings.
 */
@Component({
  selector: "app-import-additional-settings",
  templateUrl: "./import-additional-settings.component.html",
  styleUrls: ["./import-additional-settings.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatExpansionModule,
    MatFormFieldModule,
    MatTooltipModule,
    HelpButtonComponent,
    BasicAutocompleteComponent,
    FormsModule,
    CommonModule,
  ],
})
export class ImportAdditionalSettingsComponent {
  entityType = input<string>();

  settings = model<ImportAdditionalSettings>({});

  // Input for auto-detected delimiter from parsed CSV data
  autoDetectedDelimiter = input<string>();

  get multiValueSeparator(): string {
    // Use auto-detected delimiter as default, fallback to comma
    return (
      this.settings()?.multiValueSeparator ??
      this.autoDetectedDelimiter() ??
      ","
    );
  }

  set multiValueSeparator(value: string) {
    this.settings.update((s) => ({ ...s, multiValueSeparator: value }));
  }

  readonly separatorOptions: string[] = [",", ";"];

  createCustomSeparator = async (input: string) => input;
}
