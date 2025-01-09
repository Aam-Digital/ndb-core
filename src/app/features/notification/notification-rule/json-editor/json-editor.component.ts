import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";

@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  templateUrl: "./json-editor.component.html",
})
export class JsonEditorComponent {
  /**
   * JSON value to be edited by user.
   */
  @Input() value: any;

  jsonData: string;

  @Output() valueChange = new EventEmitter<any>();

  // TODO: research if there are json editor components on npm

  constructor(
    public dialogRef: MatDialogRef<JsonEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.jsonData = JSON.stringify(data.conditions, null, 2);
  }

  onSave(): void {
    try {
      const parsed = JSON.parse(this.jsonData);
      this.dialogRef.close(parsed);
    } catch (e) {
      alert("Invalid JSON format.");
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
