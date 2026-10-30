import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  getVisibleColumnIds,
  injectCurrentScreenSize,
} from "#src/app/utils/media/visible-columns";
import {
  SchemaEmbedArrayApplyChange,
  SchemaEmbedArrayEntryDialogComponent,
  SchemaEmbedArrayEntryDialogData,
} from "../schema-embed-array-entry-dialog/schema-embed-array-entry-dialog.component";

/**
 * Table of the entries of a `schema-embed-array` field, one row per entry and one column per inner field,
 * rendering each cell through the inner field's view component.
 *
 * If `applyChange` is given, clicking an entry opens a popup to view, edit or delete that single entry
 * (see {@link SchemaEmbedArrayEntryDialogComponent}) and an "add" button allows creating new entries.
 * Otherwise, it is a plain read-only table.
 */
@Component({
  selector: "app-schema-embed-array-table",
  imports: [
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    DynamicComponentDirective,
    FaDynamicIconComponent,
  ],
  templateUrl: "./schema-embed-array-table.component.html",
  styleUrls: ["./schema-embed-array-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.compact]": "compact()" },
})
export class SchemaEmbedArrayTableComponent {
  private readonly dialog = inject(MatDialog);

  rows = input.required<Record<string, any>[]>();

  /** Columns to display, each already carrying its resolved `viewComponent`. */
  columns = input.required<FormFieldConfig[]>();

  /**
   * All inner fields that can be edited in the popup of a single entry
   * (default: the displayed columns).
   */
  editColumns = input<FormFieldConfig[]>();

  /** The entity holding the entries (context for the inner fields' validators in the popup). */
  entity = input<Entity>();

  /** Persist a changed list of entries; enables opening the popup of an entry if set. */
  applyChange = input<SchemaEmbedArrayApplyChange>();

  /** @see SchemaEmbedArrayEntryDialogData.deferSave */
  deferSave = input(false);

  /** Whether entries can only be viewed in their popup, not added, changed or deleted. */
  readonly = input(false);

  /** Small and borderless display, e.g. for a preview in a tooltip. */
  compact = input(false);

  readonly ACTION_COLUMN = "__edit";

  readonly interactive = computed(() => !!this.applyChange());

  private readonly currentScreenSize = injectCurrentScreenSize();

  readonly columnsToDisplay = computed(() => {
    const columns = getVisibleColumnIds(
      this.columns(),
      this.currentScreenSize(),
    );
    return this.interactive() && !this.readonly()
      ? [this.ACTION_COLUMN, ...columns]
      : columns;
  });

  /**
   * Open the popup for a single entry.
   * @param index position of the entry to open; a new entry is created if not given
   */
  openEntry(index?: number) {
    if (!this.interactive()) {
      return;
    }

    this.dialog.open<
      SchemaEmbedArrayEntryDialogComponent,
      SchemaEmbedArrayEntryDialogData
    >(SchemaEmbedArrayEntryDialogComponent, {
      ...FormDialogService.dialogSettings,
      data: {
        entries: this.rows(),
        index,
        columns: this.editColumns() ?? this.columns(),
        entity: this.entity(),
        readonly: this.readonly(),
        applyChange: this.applyChange(),
        deferSave: this.deferSave(),
      },
    });
  }
}
