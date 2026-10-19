import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AlertService } from "../../../alerts/alert.service";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { DynamicValidatorsService } from "../../../common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityFieldEditComponent } from "../../../entity/entity-field-edit/entity-field-edit.component";
import { Entity } from "../../../entity/model/entity";
import { UnsavedChangesService } from "../../form/unsaved-changes.service";
import { buildSchemaEmbedEntryForm } from "../../../basic-datatypes/schema-embed/schema-embed-entry-form";

/**
 * Data interface that must be given when opening the dialog
 */
export interface EmbeddedArrayEntryDialogData {
  /** The entity holding the embedded entries, which is saved with the changed entry */
  entity: Entity;
  /** Property of the entity holding the embedded entries */
  property: string;
  /** Position of the entry to edit within the entries; a new entry is added if not given */
  index?: number;
  /** The inner fields of the embedded entries to edit */
  columns: FormFieldConfig[];
  /** Whether the entry can only be viewed, not changed */
  readonly?: boolean;
}

/**
 * Popup to view, edit or delete a single entry of an entity's `schema-embed-array` property,
 * looking like the {@link RowDetailsComponent} popup of related entities.
 *
 * Saving or deleting the entry directly saves the entity and closes the popup with the saved entity as result.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-embedded-array-entry-dialog",
  templateUrl: "./embedded-array-entry-dialog.component.html",
  styleUrl: "./embedded-array-entry-dialog.component.scss",
  // no encapsulation to style the mat-form-fields nested in the field components, like EntityFormComponent does
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    DialogCloseComponent,
    EntityFieldEditComponent,
    FaDynamicIconComponent,
  ],
})
export class EmbeddedArrayEntryDialogComponent {
  protected readonly data =
    inject<EmbeddedArrayEntryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<EmbeddedArrayEntryDialogComponent, Entity>>(
      MatDialogRef,
    );
  private readonly entityFormService = inject(EntityFormService);
  private readonly dynamicValidators = inject(DynamicValidatorsService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isNew = this.data.index === undefined;

  readonly form: FormGroup = this.buildForm();

  constructor() {
    if (this.data.readonly) {
      this.form.disable();
    }

    // same as the popup of related entities: ask before discarding changes when clicking outside
    this.dialogRef.disableClose = true;
    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed())
      .subscribe(async () => {
        if (await this.unsavedChanges.checkUnsavedChanges(this)) {
          this.dialogRef.close();
        }
      });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.unsavedChanges.setUnsavedChanges(this, this.form.dirty),
      );
    this.destroyRef.onDestroy(() =>
      this.unsavedChanges.setUnsavedChanges(this, false),
    );
  }

  private buildForm(): FormGroup {
    const entry = this.isNew ? {} : this.getEntries()[this.data.index];
    return buildSchemaEmbedEntryForm(
      this.data.columns,
      entry,
      this.dynamicValidators,
      this.data.entity,
    );
  }

  private getEntries(): Record<string, any>[] {
    return [...(this.data.entity[this.data.property] ?? [])];
  }

  async save() {
    // errors regarding invalid fields won't be displayed unless marked as touched
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const entries = this.getEntries();
    const entry = this.form.getRawValue();
    if (this.isNew) {
      entries.push(entry);
    } else {
      entries[this.data.index] = entry;
    }
    await this.saveEntries(entries);
  }

  async delete() {
    const confirmed = await this.confirmation.getConfirmation(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text for an entry of an embedded table:Are you sure you want to delete this entry?`,
    );
    if (!confirmed) {
      return;
    }

    const entries = this.getEntries();
    entries.splice(this.data.index, 1);
    await this.saveEntries(entries);
  }

  cancel() {
    // discard this form's unsaved changes
    this.unsavedChanges.setUnsavedChanges(this, false);
    this.dialogRef.close();
  }

  /**
   * Save the entity with the given entries through the standard entity form logic
   * (including validation and permission checks) and close the popup with the saved entity.
   */
  private async saveEntries(entries: Record<string, any>[]) {
    const entity = this.data.entity;
    const entityForm = await this.entityFormService.createEntityForm(
      [this.data.property],
      entity,
      this.destroyRef,
      false,
      true,
      false,
    );
    entityForm.formGroup.get(this.data.property).setValue(entries);

    try {
      const saved = await this.entityFormService.saveChanges(
        entityForm,
        entity,
      );
      this.unsavedChanges.setUnsavedChanges(this, false);
      this.dialogRef.close(saved);
    } catch (err) {
      // validation errors of the whole property are not visible in this popup's fields, so always show an alert
      this.alertService.addDanger(err.message);
    }
  }
}
