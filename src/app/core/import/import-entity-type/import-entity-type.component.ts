import {
  Component,
  ChangeDetectionStrategy,
  model,
  signal,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-entity-type",
  templateUrl: "./import-entity-type.component.html",
  styleUrls: ["./import-entity-type.component.scss"],
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
  entityType = model<string>();

  /**
   * Whether to show all, including administrative, entity types for selection.
   */
  expertMode = signal(false);

  onSelectedTypeChange(newType) {
    this.entityType.set(newType);
  }

  // TODO: infer entityType automatically -> pre-select + UI explanatory text
}
