import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { JsonEditorComponent } from "app/features/json-editor/json-editor.component";

@Component({
  selector: "app-notification-condition-editor",
  standalone: true,
  imports: [JsonEditorComponent, MatDialogModule, DialogCloseComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./notification-condition-editor.component.html",
})
export class NotificationConditionEditorComponent {
  jsonData: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    console.log(data);
    this.jsonData = data?.value;
  }

  onJsonChange(json: any) {
    this.jsonData = json;

    console.log("JSON data changed", json);
  }
}
