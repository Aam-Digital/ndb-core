import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../entity-form/entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { NgIf } from "@angular/common";

/**
 * Generic component to display the label of one form field of an entity
 * without having to handle overwriting the field config with potentially missing schema field details.
 */
@Component({
  selector: "app-entity-field-label",
  templateUrl: "./entity-field-label.component.html",
  standalone: true,
  imports: [MatTooltipModule, NgIf],
})
export class EntityFieldLabelComponent implements OnChanges {
  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  /** optional alternative to passing an entity, you can provide an entity type only */
  @Input() entityType: EntityConstructor;

  constructor(private entityFormService: EntityFormService) {}

  ngOnChanges(changes: SimpleChanges): void {
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
      this.entityType,
    );
  }
}
