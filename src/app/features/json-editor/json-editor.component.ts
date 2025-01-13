import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { createJSONEditor } from "vanilla-jsoneditor/standalone.js";

@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: "./json-editor.component.html",
})
export class JsonEditorComponent {
  /**
   * JSON value to be edited by the user.
   */
  @Input() value: any;

  @Output() valueChange = new EventEmitter<any>();

  @ViewChild("json", { static: true }) json!: ElementRef<HTMLDivElement>;

  private editor: any;

  constructor() {}

  ngAfterViewInit(): void {
    this.editor = createJSONEditor({
      target: this.json.nativeElement,
      props: {
        content: { json: this.value || {} },
        onChange: (updatedContent: any, { contentErrors }: any) => {
          console.log({ updatedContent });
          if (contentErrors?.length === 0) {
            this.value = updatedContent.json;
          }
        },
      },
    });
  }

  onSave() {
    try {
      const updatedJson = this.editor.get();
      console.log({ updatedJson });
      this.valueChange.emit(updatedJson.json); // Emit updated JSON data
    } catch (e) {
      alert("Invalid JSON format.");
    }
  }

  onCancel() {
    this.editor.update({ json: this.value });
  }
}
