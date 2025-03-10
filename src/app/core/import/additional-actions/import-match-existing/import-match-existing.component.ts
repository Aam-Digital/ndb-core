import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { EntityFieldSelectComponent } from "../../../entity/entity-field-select/entity-field-select.component";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";

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
  ],
  templateUrl: "./import-match-existing.component.html",
  styleUrl: "./import-match-existing.component.scss",
})
export class ImportMatchExistingComponent {
  /**
   * The existing value, currently selected "ID fields".
   */
  @Input() idFields: string[];

  /**
   * New values selected by the user for the "ID fields".
   */
  @Output() idFieldsChange = new EventEmitter<string[]>();

  @Input() entityType: string;

  updateValue(newValue: string[] | string) {
    this.idFieldsChange.emit(newValue as string[]);
  }
}
