import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  resource,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { InvalidFormFieldError } from "#src/app/core/common-components/entity-form/invalid-form-field.error";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  createEmbeddedEntity,
  EmbeddedEntity,
} from "#src/app/core/entity/model/embedded-entity";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { getEmbeddedSchema } from "#src/app/core/entity/schema/embedded-schema-field.util";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { isEmptyValue } from "#src/app/utils/is-empty-value";
import {
  isStoredEntry,
  markStoredEntry,
  SchemaEmbedArrayEntryChange,
} from "../schema-embed-array-entry-change";

/**
 * Apply the change of a single entry of a `schema-embed-array` field to its latest entries
 * (see {@link applySchemaEmbedArrayEntryChange}),
 * e.g. by saving the entity or by setting the value of the field's form control.
 *
 * Throw an error to keep the popup open (its message is displayed to the user).
 */
export type SchemaEmbedArrayApplyChange = (
  change: SchemaEmbedArrayEntryChange,
) => Promise<void>;

/**
 * Data interface that must be given when opening the dialog
 */
export interface SchemaEmbedArrayEntryDialogData {
  /** All entries of the field when opening the popup */
  entries: Record<string, any>[];
  /** Position of the entry to edit within the entries; a new entry is added if not given */
  index?: number;
  /** The `schema-embed-array` field holding the entries */
  field: FormFieldConfig;
  /** The inner fields of the embedded entries to edit */
  columns: FormFieldConfig[];
  /**
   * The record holding the embedded entries, which is the context of the entry's inner fields
   * (e.g. for permissions); not set if the entries are edited without a record
   */
  entity?: Entity;
  /** Whether the entry can only be viewed, not changed */
  readonly?: boolean;
  /** Called with the change of the entry when saving or deleting it */
  applyChange: SchemaEmbedArrayApplyChange;
  /**
   * Whether `applyChange` only passes the changes on to be saved later (e.g. with a surrounding form),
   * labelling the save button "Apply" instead of "Save".
   */
  deferSave?: boolean;
}

/**
 * Popup to view, edit or delete a single entry of a `schema-embed-array` field,
 * looking like the {@link RowDetailsComponent} popup of related entities.
 *
 * The entry is edited like a record through the standard entity form logic,
 * wrapped as {@link EmbeddedEntity}.
 *
 * Saving or deleting the entry passes only that change to `applyChange`
 * (deciding how to persist it, based on the latest entries) and closes the popup with the change as result.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-schema-embed-array-entry-dialog",
  templateUrl: "./schema-embed-array-entry-dialog.component.html",
  styleUrl: "./schema-embed-array-entry-dialog.component.scss",
  // no encapsulation to style the mat-form-fields nested in the field components, like EntityFormComponent does
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule, // importing FormsModule prevents native form submission / page reload (e.g. pressing Enter in a field)
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    DialogCloseComponent,
    EntityFieldEditComponent,
    FaDynamicIconComponent,
  ],
})
export class SchemaEmbedArrayEntryDialogComponent {
  protected readonly data =
    inject<SchemaEmbedArrayEntryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        SchemaEmbedArrayEntryDialogComponent,
        SchemaEmbedArrayEntryChange
      >
    >(MatDialogRef);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isNew = this.data.index === undefined;

  /** The edited entry as it was when opening the popup */
  private readonly original: Record<string, any> | undefined = this.isNew
    ? undefined
    : this.data.entries[this.data.index];

  /**
   * Whether the edited entry is stored in its record.
   * An entry that was only added in a form of the record that is not saved yet is not,
   * so its fields (e.g. with `readonlyAfterSet`) can still be corrected.
   */
  private readonly isStored =
    !this.isNew &&
    (!this.data.entity ||
      isStoredEntry(this.original, this.data.entity[this.data.field.id]));

  /** The edited entry, wrapped to be edited like a record */
  readonly entry: EmbeddedEntity = createEmbeddedEntity(
    getEmbeddedSchema(this.entitySchemaService, this.data.field) ?? new Map(),
    {
      record: this.data.entity,
      field: this.data.field.id,
      existing: this.isStored,
    },
    this.original,
  );

  private readonly entryFormResource = resource({
    loader: () =>
      this.createEntryForm().catch((err) => {
        Logging.error("Could not create the form of an embedded entry", err);
        return undefined;
      }),
  });

  /** The form of the entry, available once created */
  readonly entryForm = computed<EntityForm<EmbeddedEntity> | undefined>(() =>
    this.entryFormResource.value(),
  );

  constructor() {
    // same as the popup of related entities: ask before discarding changes when clicking outside
    this.dialogRef.disableClose = true;
    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed())
      .subscribe(async () => {
        // only this popup's changes count, not those of a form it was opened from
        const entryForm = this.entryForm();
        if (
          !entryForm ||
          (await this.unsavedChanges.checkUnsavedChanges(entryForm))
        ) {
          this.dialogRef.close();
        }
      });
  }

  private async createEntryForm(): Promise<EntityForm<EmbeddedEntity>> {
    const entryForm = await this.entityFormService.createEntityForm(
      this.data.columns,
      this.entry,
      this.destroyRef,
      /* forTable */ false,
      // without a record, there are no permissions to check the entry against
      /* withPermissionCheck */ !!this.data.entity,
      // default values for new entries are not supported yet
      /* withDefaultValues */ false,
    );
    if (this.data.readonly) {
      entryForm.formGroup.disable();
    }
    return entryForm;
  }

  async save() {
    const entryForm = this.entryForm();
    if (!entryForm) {
      return;
    }
    if (!this.isNew && !entryForm.formGroup.dirty) {
      // nothing changed
      this.cancel();
      return;
    }

    let edited: EmbeddedEntity;
    try {
      edited = this.entityFormService.applyChanges(entryForm, this.entry);
    } catch (err) {
      // invalid fields are highlighted in the form, other errors need an alert
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
      return;
    }

    const entry = edited.toEntryValue(this.original);
    if (this.isNew && Object.values(entry).every(isEmptyValue)) {
      // nothing entered, don't add a blank entry
      this.cancel();
      return;
    }

    if (this.isStored) {
      // keeps the entry's fields locked when it is opened again before its record is saved
      markStoredEntry(entry);
    }
    await this.applyChange({
      entry,
      index: this.data.index,
      original: this.original,
    });
  }

  async delete() {
    const confirmed = await this.confirmation.getConfirmation(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text for an entry of an embedded table:Are you sure you want to delete this entry?`,
    );
    if (!confirmed) {
      return;
    }

    await this.applyChange({
      delete: true,
      index: this.data.index,
      original: this.original,
    });
  }

  cancel() {
    this.discardUnsavedChanges();
    this.dialogRef.close();
  }

  private discardUnsavedChanges() {
    const entryForm = this.entryForm();
    if (entryForm) {
      this.unsavedChanges.setUnsavedChanges(entryForm, false);
    }
  }

  private async applyChange(change: SchemaEmbedArrayEntryChange) {
    try {
      await this.data.applyChange(change);
      this.discardUnsavedChanges();
      this.dialogRef.close(change);
    } catch (err) {
      // e.g. validation errors of the whole property are not visible in this popup's fields, so always show an alert
      this.alertService.addDanger(err.message);
    }
  }
}
