import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  Optional,
  Self,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Content, createJSONEditor } from "vanilla-jsoneditor/standalone.js";
import { AlertService } from "../../alerts/alert.service";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { NgControl, NgForm, FormGroupDirective } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";

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
export class JsonEditorComponent extends CustomFormControlDirective<object> {
  @Output() isValidChange = new EventEmitter<boolean>();

  @ViewChild("json", { static: true }) json!: ElementRef<HTMLDivElement>;

  constructor(
    private alertService: AlertService,
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );
  }

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
        content: { json: this.value || {} },
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
    this.value = updatedJSON;
    this.valueChange.emit(this.value);
  }

  /**
   * Handle the change event from the text editor.
   * @param updatedText The updated text data.
   */
  handleTextChange(updatedText: string): void {
    try {
      this.value = updatedText ? JSON.parse(updatedText) : {};
      this.valueChange.emit(this.value);
      this.isValidChange.emit(true);
    } catch (e) {
      this.isValidChange.emit(false);
    }
  }
}
