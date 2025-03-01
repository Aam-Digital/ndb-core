import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { EntityTypeSelectComponent } from "../../entity/entity-type-select/entity-type-select.component";

/**
 * Import sub-step: Let user select which entity type data should be imported as.
 */
@Component({
  selector: "app-import-entity-type",
  templateUrl: "./import-entity-type.component.html",
  styleUrls: ["./import-entity-type.component.scss"],
  standalone: true,
  imports: [
    MatInputModule,
    MatSelectModule,
    HelpButtonComponent,
    MatSlideToggleModule,
    FormsModule,
    EntityTypeSelectComponent,
  ],
})
export class ImportEntityTypeComponent {
  /** user selected entity type */
  @Output() entityTypeChange = new EventEmitter<string>();

  /** pre-selected entity type */
  @Input() entityType: string;

  /**
   * Whether to show all, including administrative, entity types for selection.
   */
  expertMode: boolean = false;

  onSelectedTypeChange(newType) {
    this.entityTypeChange.emit(newType);
  }

  // TODO: infer entityType automatically -> pre-select + UI explanatory text
}
