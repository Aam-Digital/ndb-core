import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { JsonEditorComponent } from "app/features/json-editor/json-editor.component";

@Component({
  selector: "app-notification-condition-editor",
  standalone: true,
  imports: [JsonEditorComponent, MatDialogModule, DialogCloseComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./notification-condition-editor.component.html",
  styleUrl: "./notification-condition-editor.component.scss",
})
export class NotificationConditionEditorComponent {
  jsonData: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<NotificationConditionEditorComponent>,
  ) {
    this.jsonData = data?.value;
  }

  onJsonChange(json: {}) {
    this.jsonData = json;
    this.dialogRef.close(this.jsonData);
  }
}
