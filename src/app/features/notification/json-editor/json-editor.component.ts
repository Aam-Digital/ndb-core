import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Output,
  afterNextRender,
  viewChild,
} from "@angular/core";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { createJSONEditor } from "vanilla-jsoneditor/standalone.js";

@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
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

  json = viewChild.required<ElementRef<HTMLDivElement>>("json");

  // TODO: research if there are json editor components on npm

  constructor(
    public dialogRef: MatDialogRef<JsonEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    afterNextRender(() => {
      let content = {
        text: undefined,
        json: {
          greeting: "Hello World",
        },
      };

      const editor = createJSONEditor({
        target: this.json().nativeElement,
        props: {
          content,
          onChange: (
            updatedContent: any,
            previousContent: any,
            { contentErrors, patchResult }: any,
          ) => {
            console.log("onChange", {
              updatedContent,
              previousContent,
              contentErrors,
              patchResult,
            });
            content = updatedContent;
          },
        },
      });
    });
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
