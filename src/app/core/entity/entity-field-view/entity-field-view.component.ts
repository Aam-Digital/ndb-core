import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { Entity } from "../model/entity";

/**
 * Generic component to display one entity property field's viewComponent.
 *
 * Dynamically extends field details from entity schema and
 * loads the relevant, specific EditComponent implementation.
 *
 * For editComponent form field, see EntityFieldEditComponent.
 */
@Component({
  selector: "app-entity-field-view",
  templateUrl: "./entity-field-view.component.html",
  styleUrls: ["./entity-field-view.component.scss"],
  imports: [DynamicComponentDirective],
})
export class EntityFieldViewComponent<
  E extends Entity = Entity,
> implements OnChanges {
  private entityFormService = inject(EntityFormService);

  @Input() entity: E;

  /** field id or full config */
  @Input() field: ColumnConfig;

  /** whether this field is rendered in a table view */
  @Input() forTable = false;

  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  @Input() showLabel: "inline" | "above" | "none" = "none";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field || changes.entity || changes.forTable) {
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
      this.forTable,
    );
  }
}
