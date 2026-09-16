import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

/**
 * Small, read-only borderless table rendering a `schema-embed-array` field's rows/columns.
 *
 * Shared between {@link DisplaySchemaEmbedArrayComponent}'s and
 * `EditSchemaEmbedArrayComponent`'s hover-tooltip previews, so both show the same data the
 * same way, similar to the attendance datatype's tooltip preview.
 */
@Component({
  selector: "app-schema-embed-array-table",
  imports: [DynamicComponentDirective],
  templateUrl: "./schema-embed-array-table.component.html",
  styleUrls: ["./schema-embed-array-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEmbedArrayTableComponent {
  rows = input.required<Record<string, any>[]>();
  /** Columns, each already carrying its resolved `viewComponent`. */
  columns = input.required<FormFieldConfig[]>();
}
