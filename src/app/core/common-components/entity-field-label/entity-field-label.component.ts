import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityConstructor } from "../../entity/model/entity";
import { ColumnConfig, FormFieldConfig } from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";

/**
 * Generic component to display the label of one form field of an entity
 * without having to handle overwriting the field config with potentially missing schema field details.
 */
@Component({
  selector: "app-entity-field-label",
  templateUrl: "./entity-field-label.component.html",
  imports: [MatTooltipModule],
})
export class EntityFieldLabelComponent implements OnChanges {
  private entityFormService = inject(EntityFormService);
  private entityRegistry = inject(EntityRegistry);

  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  /** entity type to look up the schema details for the given field */
  @Input() entityType: EntityConstructor | string;
  _entityType: EntityConstructor;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entityType) {
      this._entityType =
        typeof this.entityType === "string"
          ? this.entityRegistry.get(this.entityType)
          : this.entityType;
    }
    if (changes.field || changes.entityType) {
      this.updateField();
    }
  }

  private updateField() {
    if (!this.entityType) {
      this._field = undefined;
      return;
    }

    this._field = this.entityFormService.extendFormFieldConfig(
      this.field,
      this._entityType,
    );
  }
}
