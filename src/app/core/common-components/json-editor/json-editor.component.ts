import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { createJSONEditor } from "vanilla-jsoneditor/standalone.js";
import { AlertService } from "../../alerts/alert.service";

/**
 * Component for editing JSON data.
 */
@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: "./json-editor.component.html",
  styleUrl: "./json-editor.component.scss",
})
export class JsonEditorComponent {
  /**
   * JSON value to be edited by the user.
   */
  @Input() value: object = {};

  @Input() height = "65vh";

  @Output() valueChange = new EventEmitter<any>();

  @ViewChild("json", { static: true }) json!: ElementRef<HTMLDivElement>;

  private jsonEditor: any;

  constructor(private alertService: AlertService) {}

  /**
   * Initialize the JSON editor.
   * This method is called after the component view is initialized.
   * creates a JSON editor instance and sets up the onChange event handler.
   */
  ngAfterViewInit(): void {
    this.jsonEditor = createJSONEditor({
      target: this.json.nativeElement,
      props: {
        content: { json: this.value || {} },
        onChange: (updatedContent: any, { contentErrors }: any) => {
          if (contentErrors?.length === 0) {
            this.value = updatedContent.json;
          }
        },
      },
    });
  }

  /**
   * Save the JSON value and emit the updated value.
   * If the JSON is invalid, show a warning.
   */
  onSave() {
    try {
      const updatedJson = this.jsonEditor.get();
      this.valueChange.emit(updatedJson.json);
    } catch (e) {
      this.alertService.addWarning($localize`Invalid JSON`);
    }
  }

  /**
   * Cancel the changes and reset the JSON value.
   */
  onCancel() {
    this.jsonEditor.update({ json: this.value });
    this.valueChange.emit(null);
  }
}
