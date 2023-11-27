import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { HelpButtonComponent } from "../../help-button/help-button.component";
import { Entity } from "../../../entity/model/entity";
import { EntityForm, EntityFormService } from "../entity-form.service";
import { ColumnConfig } from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FormFieldConfig } from "../entity-form/FormConfig";
import { NgIf } from "@angular/common";

/**
 * Generic component to display one form field (editComponent) of an entity.
 *
 * Dynamically extends field details from entity schema and loads the relevant, specific EditComponent implementation.
 */
@Component({
  selector: "app-form-field",
  templateUrl: "./form-field.component.html",
  styleUrls: ["./form-field.component.scss"],
  standalone: true,
  imports: [DynamicComponentDirective, HelpButtonComponent, NgIf],
})
export class FormFieldComponent<T extends Entity = Entity>
  implements OnChanges
{
  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  @Input() entity: T;
  @Input() form: EntityForm<T>;

  constructor(private entityFormService: EntityFormService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field || changes.entity) {
      this.updateField();
    }
  }

  private updateField() {
    if (!this.entity?.getConstructor()) {
      this._field = undefined;
      return;
    }

    this._field = this.entityFormService.extendFormFieldConfig(
      this.field,
      this.entity.getConstructor(),
    );
  }
}
