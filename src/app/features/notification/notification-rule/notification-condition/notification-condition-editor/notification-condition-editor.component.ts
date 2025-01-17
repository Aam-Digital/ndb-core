import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { JsonEditorComponent } from "app/core/common-components/json-editor/json-editor.component";

@Component({
  selector: "app-notification-condition-editor",
  standalone: true,
  imports: [
    JsonEditorComponent,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./notification-condition-editor.component.html",
  styleUrl: "./notification-condition-editor.component.scss",
})
export class NotificationConditionEditorComponent {
  jsonData: object;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<NotificationConditionEditorComponent>,
  ) {
    this.jsonData = data?.value;
  }

  /**
   * Handle the change event from the json editor.
   * @param json The new json data.
   */
  onJsonChange(json: object) {
    this.jsonData = json;
  }

  /**
   * Save the JSON value and emit the updated value.
   */
  onJsonValueSave() {
    this.dialogRef.close(this.jsonData);
  }

  /**
   * Cancel the changes and reset the JSON value.
   */
  onJsonValueCancel() {
    this.dialogRef.close(null);
  }
}
