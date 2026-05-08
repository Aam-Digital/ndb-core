import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-field-view",
  templateUrl: "./entity-field-view.component.html",
  styleUrls: ["./entity-field-view.component.scss"],
  imports: [DynamicComponentDirective],
})
export class EntityFieldViewComponent<E extends Entity = Entity> {
  private entityFormService = inject(EntityFormService);

  entity = input<E>();

  /** field id or full config */
  field = input<ColumnConfig>();

  showLabel = input<"inline" | "above" | "none">("none");

  /** full field config extended from schema */
  readonly _field = computed<FormFieldConfig | undefined>(() => {
    const entity = this.entity();
    const field = this.field();
    if (!entity?.getConstructor()) return undefined;
    return this.entityFormService.extendFormFieldConfig(
      field,
      entity.getConstructor(),
    );
  });
}
