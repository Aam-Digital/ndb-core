import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TextFieldModule } from "@angular/cdk/text-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { LongTextFieldConfig } from "../display-long-text/display-long-text.component";

@DynamicComponent("EditLongText")
@Component({
  selector: "app-edit-long-text",
  templateUrl: "./edit-long-text.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    TextFieldModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditLongTextComponent },
  ],
})
export class EditLongTextComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();

  private readonly config = computed(
    () => this.formFieldConfig()?.additional as LongTextFieldConfig | undefined,
  );

  /** minimum height of the input box, configurable as `additional.rows` of the field */
  protected readonly minRows = computed(() => this.config()?.rows ?? 4);

  /** the input box grows with its text up to this height (`additional.maxRows`), then scrolls */
  protected readonly maxRows = computed(() =>
    Math.max(this.config()?.maxRows ?? 20, this.minRows()),
  );

  /**
   * The autosize measures the line height only once (until the window is resized).
   * Measured too early, the textarea does not have the styles of the form field yet,
   * so the min and max height are too small: only switch it on once the field is rendered.
   */
  protected readonly autosizeEnabled = signal(false);

  constructor() {
    super();
    afterNextRender(() => this.autosizeEnabled.set(true));
  }
}
