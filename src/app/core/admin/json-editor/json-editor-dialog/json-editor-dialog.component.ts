import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { JsonEditorComponent } from "../json-editor.component";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { MatFormField } from "@angular/material/form-field";

@Component({
  selector: "app-json-editor-dialog",
  standalone: true,
  imports: [
    JsonEditorComponent,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
    MatFormField,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./json-editor-dialog.component.html",
  styleUrl: "./json-editor-dialog.component.scss",
})
export class JsonEditorDialogComponent {
  jsonDataControl: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<JsonEditorDialogComponent>,
  ) {
    this.jsonDataControl = new FormControl(data?.value || {});
  }

  /**
   * Save the JSON value and emit the updated value.
   */
  onJsonValueSave() {
    if (this.jsonDataControl.valid) {
      this.dialogRef.close(this.jsonDataControl.value);
    }
  }

  /**
   * Cancel the changes and reset the JSON value.
   */
  onJsonValueCancel() {
    this.dialogRef.close(null);
  }
}
