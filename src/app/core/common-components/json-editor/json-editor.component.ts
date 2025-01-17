import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Content,
  ContentErrors,
  createJSONEditor,
} from "vanilla-jsoneditor/standalone.js";
import { AlertService } from "../../alerts/alert.service";

/**
 * Component for editing JSON data.
 */
@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./json-editor.component.html",
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
        onChange: (
          updatedContent: Content,
          {
            contentErrors,
          }: {
            contentErrors: ContentErrors | undefined;
          },
        ) => {
          if ("json" in updatedContent) {
            this.value = updatedContent.json as object;
            this.valueChange.emit(this.value);
          }
          if (contentErrors) {
            this.alertService.addWarning($localize`Invalid JSON`);
          }
        },
      },
    });
  }
}
