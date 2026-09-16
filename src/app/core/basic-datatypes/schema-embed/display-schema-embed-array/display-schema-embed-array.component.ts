import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { SchemaEmbedDatatype } from "../schema-embed.datatype";

/**
 * Generic view component for the `schema-embed-array` datatype.
 *
 * Renders a simple, borderless table - one row per array entry, one column per field defined
 * in the field's `additional` schema (or `embeddedType`, for subclasses). Each cell is rendered
 * through the view component that field's own dataType resolves to (e.g. a `date` column
 * renders through `DisplayDate`).
 *
 * `EntityFieldViewComponent` cannot be reused for cells since it requires a real `Entity`
 * instance; this drives `DynamicComponentDirective` directly instead, the same primitive
 * `EntityFieldViewComponent` uses internally.
 */
@DynamicComponent("DisplaySchemaEmbedArray")
@Component({
  selector: "app-display-schema-embed-array",
  imports: [DynamicComponentDirective],
  templateUrl: "./display-schema-embed-array.component.html",
  styleUrls: ["./display-schema-embed-array.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplaySchemaEmbedArrayComponent extends ViewDirective<
  Record<string, any>[],
  any
> {
  private readonly entitySchemaService = inject(EntitySchemaService);

  rows = computed(() => this.value() ?? []);

  /** The inner fields (table columns), each with its resolved viewComponent for rendering cells. */
  columns = computed<FormFieldConfig[]>(() => {
    const fieldConfig = this.formFieldConfig();
    if (!fieldConfig?.dataType) {
      return [];
    }
    const dataType = this.entitySchemaService.getDatatypeOrDefault(
      fieldConfig.dataType,
    ) as SchemaEmbedDatatype;
    return [...dataType.getEffectiveSchema(fieldConfig).values()].map(
      (column) => ({
        ...column,
        viewComponent: this.entitySchemaService.getComponent(column, "view"),
      }),
    ) as FormFieldConfig[];
  });
}
