import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Content, createJSONEditor } from "vanilla-jsoneditor/standalone.js";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { Logging } from "../../logging/logging.service";

/**
 * Component for editing JSON data.
 */
@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./json-editor.component.html",
  styleUrl: "./json-editor.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: JsonEditorComponent },
  ],
})
export class JsonEditorComponent
  extends CustomFormControlDirective<object>
  implements AfterViewInit
{
  @ViewChild("json", { static: true }) json!: ElementRef<HTMLDivElement>;

  /**
   * Initialize the JSON editor.
   * This method is called after the component view is initialized.
   */
  ngAfterViewInit(): void {
    this.initializeJSONEditor();
  }

  /**
   * Initializes the JSON editor and sets up event handlers.
   */
  private initializeJSONEditor(): void {
    createJSONEditor({
      target: this.json.nativeElement,
      props: {
        content: { json: this.ngControl?.control?.value ?? {} },
        mode: "text",
        onChange: (updatedContent: Content) =>
          this.handleEditorChange(updatedContent),
      },
    });
  }

  /**
   * Handles changes from the JSON editor.
   * @param updatedContent The updated content from the editor.
   */
  private handleEditorChange(updatedContent: Content): void {
    if ("json" in updatedContent) {
      this.handleJSONChange(updatedContent.json as object);
    }
    if ("text" in updatedContent && updatedContent.text) {
      this.handleTextChange(updatedContent.text);
    }
  }

  /**
   * Handle the change event from the JSON editor.
   * @param updatedJSON The updated JSON data.
   */
  handleJSONChange(updatedJSON: object): void {
    this.writeValue(updatedJSON);
  }

  /**
   * Handle the change event from the text editor.
   * @param updatedText The updated text data.
   */
  handleTextChange(updatedText: string): void {
    try {
      this.writeValue(updatedText ? JSON.parse(updatedText) : {});
    } catch (e) {
      const control = this.ngControl?.control;
      if (!control) {
        Logging.debug("No FormControl in JsonEditorComponent");
        return;
      }
      this.ngControl.control.setErrors({ invalidJson: true });
    }
  }
}
