import { Component, input, model } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { EntityFieldSelectComponent } from "../../../entity/entity-field-select/entity-field-select.component";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { ImportExistingSettings } from "../../import-metadata";

/**
 * Allow the user to configure entity fields that are used to match imported data to existing entities in the DB.
 */
@Component({
  selector: "app-import-match-existing",
  standalone: true,
  imports: [
    MatExpansionModule,
    MatFormField,
    MatLabel,
    MatHint,
    EntityFieldSelectComponent,
    HelpButtonComponent,
    MatSlideToggle,
    FormsModule,
  ],
  templateUrl: "./import-match-existing.component.html",
  styleUrl: "./import-match-existing.component.scss",
})
export class ImportMatchExistingComponent {
  entityType = input<string>();
  settings = model<ImportExistingSettings | undefined>();

  updateMatchFields(newValue: string[] | string) {
    const fields = newValue as string[];
    if (!fields?.length) {
      this.settings.set(undefined);
      return;
    }

    this.settings.update((s) => ({
      ...(s ?? {}),
      matchExistingByFields: fields,
    }));
  }

  updateStrictMatching(value: boolean) {
    this.settings.update((s) => ({
      ...(s ?? {}),
      strictMatching: value,
    }));
  }
}
