import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { SchemaEmbedDatatype } from "../schema-embed.datatype";
import { SchemaEmbedArrayTableComponent } from "../schema-embed-array-table/schema-embed-array-table.component";

/**
 * Generic view component for the `schema-embed-array` datatype.
 *
 * Shows just a small "N entries" text (nothing when there are no entries), and reveals a
 * read-only preview table on hover via {@link TemplateTooltipDirective} - the same pattern
 * the attendance datatype's display component uses for its participant list.
 */
@DynamicComponent("DisplaySchemaEmbedArray")
@Component({
  selector: "app-display-schema-embed-array",
  imports: [TemplateTooltipDirective, SchemaEmbedArrayTableComponent],
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
