import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity } from "#src/app/core/entity/model/entity";
import { SchemaEmbedArrayTableComponent } from "../../schema-embed-array-table/schema-embed-array-table.component";
import { SchemaEmbedArrayApplyChange } from "../../schema-embed-array-entry-dialog/schema-embed-array-entry-dialog.component";

export interface SchemaEmbedArrayDialogData {
  /** The field's FormControl, holding the entries and receiving their changes. */
  formControl: FormControl<Record<string, any>[]>;
  /** The inner fields (table columns), resolved from the field's schema-embed configuration. */
  columns: FormFieldConfig[];
  /** The entity holding the field (context for the inner fields' validators). */
  entity: Entity;
  /** Dialog title, typically the field's own label. */
  label?: string;
}

/**
 * Popup listing all entries of a `schema-embed-array` form field in a table
 * (see {@link SchemaEmbedArrayTableComponent}), where single entries can be added, edited or deleted.
 *
 * Changed entries are written to the field's FormControl only;
 * the outer entity form's own Save/Cancel still governs persisting or discarding them.
 * While the field is disabled (i.e. the form is not in edit mode), entries can only be viewed.
 */
@Component({
  selector: "app-schema-embed-array-dialog",
  imports: [
    MatButtonModule,
    MatDialogModule,
    DialogCloseComponent,
    SchemaEmbedArrayTableComponent,
  ],
  templateUrl: "./schema-embed-array-dialog.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEmbedArrayDialogComponent {
  protected readonly data = inject<SchemaEmbedArrayDialogData>(MAT_DIALOG_DATA);

  /** The field's disabled state as of when the dialog opened (read once, not tracked live). */
  protected readonly readonly = this.data.formControl.disabled;

  readonly rows = signal<Record<string, any>[]>(
    this.data.formControl.value ?? [],
  );

  readonly applyChange: SchemaEmbedArrayApplyChange = async (entries) => {
    this.data.formControl.setValue(entries);
    this.data.formControl.markAsDirty();
    this.rows.set(entries);
  };
}
