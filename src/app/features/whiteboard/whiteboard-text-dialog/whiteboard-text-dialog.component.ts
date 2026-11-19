import { Component, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";

export interface WhiteboardTextDialogData {
  title: string;
  text?: string;
  multiline?: boolean;
  /** offer a button to remove the edited item */
  allowRemove?: boolean;
}

/** `remove` when the user chose to delete the item, the text otherwise; undefined when cancelled */
export type WhiteboardTextDialogResult = { text: string } | "remove";

/**
 * Small dialog to edit the text of a whiteboard item (note, label, group title, connection label).
 */
@Component({
  selector: "app-whiteboard-text-dialog",
  templateUrl: "./whiteboard-text-dialog.component.html",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    DialogCloseComponent,
  ],
})
export class WhiteboardTextDialogComponent {
  readonly data = inject<WhiteboardTextDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<WhiteboardTextDialogComponent, WhiteboardTextDialogResult>
    >(MatDialogRef);

  readonly text = new FormControl(this.data.text ?? "", { nonNullable: true });

  save() {
    this.dialogRef.close({ text: this.text.value.trim() });
  }

  remove() {
    this.dialogRef.close("remove");
  }
}
