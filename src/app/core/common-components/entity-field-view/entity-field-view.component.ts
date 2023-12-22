import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { ColumnConfig, FormFieldConfig } from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { PillComponent } from "../pill/pill.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, DynamicComponentDirective, PillComponent],
  standalone: true,
})
export class EntityFieldViewComponent<E extends Entity = Entity>
  implements OnChanges
{
  @Input() entity: E;

  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  @Input() showLabel: "inline" | "above" | "none" = "none";

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
