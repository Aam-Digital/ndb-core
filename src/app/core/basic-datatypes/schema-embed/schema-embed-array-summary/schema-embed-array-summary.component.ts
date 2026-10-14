import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

/**
 * One-line textual summary of a `schema-embed-array` field's value,
 * e.g. "Passport, ID Card +1 more".
 *
 * Shows the first column's value of the first few entries (skipping entries where it is empty),
 * each rendered through the column's own view component, so this works for any datatype.
 * Falls back to a plain "N entries" count if there are no columns or no such values.
 */
@Component({
  selector: "app-schema-embed-array-summary",
  imports: [DynamicComponentDirective],
  templateUrl: "./schema-embed-array-summary.component.html",
  styleUrls: ["./schema-embed-array-summary.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEmbedArraySummaryComponent {
  static readonly MAX_PREVIEW_ENTRIES = 2;

  rows = input.required<Record<string, any>[]>();
  /** Columns, each already carrying its resolved `viewComponent`. */
  columns = input.required<FormFieldConfig[]>();

  summaryColumn = computed<FormFieldConfig | undefined>(
    () => this.columns()[0],
  );

  /** First column's values of the first entries that have one. */
  previewValues = computed<any[]>(() => {
    const column = this.summaryColumn();
    if (!column) {
      return [];
    }
    return this.rows()
      .map((row) => row?.[column.id])
      .filter((value) => !isEmpty(value))
      .slice(0, SchemaEmbedArraySummaryComponent.MAX_PREVIEW_ENTRIES);
  });

  /** Number of entries not covered by {@link previewValues}. */
  moreCount = computed(() => this.rows().length - this.previewValues().length);
}

function isEmpty(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}
