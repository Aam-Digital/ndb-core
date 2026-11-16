import { Component, inject, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { EditEntityComponent } from "../../../core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityTypeSelectComponent } from "../../../core/entity/entity-type-select/entity-type-select.component";

/**
 * Dialog to pick records of any type to add to a whiteboard.
 * Closes with the prefixed ids of the selected records.
 */
@Component({
  selector: "app-add-whiteboard-entity-dialog",
  templateUrl: "./add-whiteboard-entity-dialog.component.html",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    ReactiveFormsModule,
    DialogCloseComponent,
    EntityTypeSelectComponent,
    EditEntityComponent,
  ],
})
export class AddWhiteboardEntityDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<AddWhiteboardEntityDialogComponent, string[]>>(
      MatDialogRef,
    );

  readonly entityType = new FormControl<string | undefined>(undefined);
  readonly entityIds = new FormControl<string[]>([], { nonNullable: true });

  readonly selectedType = signal<string | undefined>(undefined);

  constructor() {
    this.entityType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => {
        this.entityIds.setValue([]);
        this.selectedType.set(type ?? undefined);
      });
  }

  add() {
    this.dialogRef.close(this.entityIds.value);
  }
}
