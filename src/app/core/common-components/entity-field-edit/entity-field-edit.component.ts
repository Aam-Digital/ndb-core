import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { HelpButtonComponent } from "../help-button/help-button.component";
import { Entity } from "../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../entity-form/entity-form.service";
import { ColumnConfig, FormFieldConfig } from "../entity-form/FormConfig";
import { NgIf } from "@angular/common";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { InheritedValueButtonComponent } from "../../default-values/inherited-value-button/inherited-value-button.component";

/**
 * Generic component to display one entity property field's editComponent.
 *
 * Dynamically extends field details from entity schema and
 * loads the relevant, specific EditComponent implementation.
 *
 * For viewComponent of a field, see EntityFieldViewComponent.
 */
@Component({
  selector: "app-entity-field-edit",
  templateUrl: "./entity-field-edit.component.html",
  styleUrls: ["./entity-field-edit.component.scss"],
  standalone: true,
  imports: [
    DynamicComponentDirective,
    HelpButtonComponent,
    NgIf,
    EntityFieldViewComponent,
    InheritedValueButtonComponent,
  ],
})
export class EntityFieldEditComponent<T extends Entity = Entity>
  implements OnChanges
{
  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  @Input() entity: T;
  @Input() form: EntityForm<T>;

  /**
   * Whether to display the field in a limited space, hiding details like the help description button.
   */
  @Input() compactMode: boolean;

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
