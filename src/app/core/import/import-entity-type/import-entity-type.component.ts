import {
  Component,
  ChangeDetectionStrategy,
  inject,
  model,
  signal,
} from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { EntityTypeSelectComponent } from "../../entity/entity-type-select/entity-type-select.component";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityAbility } from "../../permissions/ability/entity-ability";

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
  private readonly ability = inject(EntityAbility);

  /** user selected entity type */
  entityType = model<string>();

  /**
   * Whether to show all, including administrative, entity types for selection.
   */
  expertMode = signal(false);

  disableTypeOption = (type: EntityConstructor) =>
    this.ability.initialized && this.ability.cannot("create", type);

  typeOptionToString = (type: EntityConstructor) => {
    const label = type.label ?? type.ENTITY_TYPE;
    return this.disableTypeOption(type)
      ? $localize`${label} (no permission)`
      : label;
  };

  onSelectedTypeChange(newType) {
    this.entityType.set(newType);
  }

  // TODO: infer entityType automatically -> pre-select + UI explanatory text
}
