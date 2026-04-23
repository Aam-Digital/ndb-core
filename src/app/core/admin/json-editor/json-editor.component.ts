import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import {
  Content,
  createJSONEditor,
  Mode,
} from "vanilla-jsoneditor/standalone.js";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { Logging } from "../../logging/logging.service";

/**
 * Component for editing JSON data.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-json-editor",
  standalone: true,
  imports: [],
  templateUrl: "./json-editor.component.html",
  styleUrl: "./json-editor.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: JsonEditorComponent },
  ],
})
export class JsonEditorComponent
  extends CustomFormControlDirective<object>
  implements AfterViewInit, OnDestroy
{
  /**
   * Text mode uses CodeMirror internally, which virtualises rendering by only keeping
   * DOM "tiles" for the visible viewport. When a JSON value contains very long strings
   * (e.g. a lengthy SQL query stored as a report definition), the full document can
   * exceed what CodeMirror renders, causing a "No tile at position X" crash on any
   * keyboard or mouse event that tries to measure an off-screen position.
   * Switching to tree mode avoids the CodeMirror text-editor entirely for such content.
   * See https://github.com/Aam-Digital/ndb-core/issues/3821
   */
  private static readonly RISKY_TEXT_MODE_STRING_LENGTH = 1000;

  @ViewChild("json", { static: true }) json!: ElementRef<HTMLDivElement>;
  private editor?: ReturnType<typeof createJSONEditor>;
  private textModeDisabledForSession = false;

  /**
   * Initialize the JSON editor.
   * This method is called after the component view is initialized.
   */
  ngAfterViewInit(): void {
    this.initializeJSONEditor();
  }

  override ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = undefined;
    super.ngOnDestroy();
  }

  /**
   * Initializes the JSON editor and sets up event handlers.
   */
  private initializeJSONEditor(): void {
    const initialContent: Content = {
      json: this.ngControl?.control?.value ?? {},
    };
    this.textModeDisabledForSession =
      this.shouldDisableTextModeForContent(initialContent);
    this.createEditor(
      initialContent,
      this.textModeDisabledForSession ? Mode.tree : Mode.text,
    );
  }

  /**
   * Creates a new JSON editor instance for the given content and mode.
   */
  private createEditor(content: Content, mode: Mode): void {
    this.editor = createJSONEditor({
      target: this.json.nativeElement,
      props: {
        content,
        mode,
        onChange: (updatedContent: Content) =>
          this.handleEditorChange(updatedContent),
        onChangeMode: (mode: Mode) => this.handleEditorModeChange(mode),
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
      return;
    }

    if ("text" in updatedContent) {
      this.handleTextChange(updatedContent.text);
    }
  }

  /**
   * Prevents switching to text mode when the session was marked as high-risk
   * for long-string edits.
   */
  private handleEditorModeChange(mode: Mode): void {
    if (this.textModeDisabledForSession && mode === Mode.text) {
      this.editor?.updateProps({ mode: Mode.tree });
    }
  }

  /**
   * Determines whether text mode should be disabled for the current content.
   */
  private shouldDisableTextModeForContent(content: Content): boolean {
    if (!("json" in content)) {
      return false;
    }

    return this.hasLongString(content.json);
  }

  /**
   * Recursively checks whether the JSON value contains at least one long string.
   */
  private hasLongString(value: unknown): boolean {
    if (typeof value === "string") {
      return value.length > JsonEditorComponent.RISKY_TEXT_MODE_STRING_LENGTH;
    }

    if (Array.isArray(value)) {
      return value.some((item) => this.hasLongString(item));
    }

    if (value && typeof value === "object") {
      return Object.values(value).some((item) => this.hasLongString(item));
    }

    return false;
  }

  /**
   * Handle the change event from the JSON editor.
   * @param updatedJSON The updated JSON data.
   */
  handleJSONChange(updatedJSON: object): void {
    this.value = updatedJSON;
  }

  /**
   * Handle the change event from the text editor.
   * @param updatedText The updated text data.
   */
  handleTextChange(updatedText: string): void {
    try {
      this.value = updatedText ? JSON.parse(updatedText) : {};
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
