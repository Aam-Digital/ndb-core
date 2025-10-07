import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditComponent } from "../../../common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditUrl")
@Component({
  selector: "app-edit-url",
  templateUrl: "./edit-url.component.html",
  styleUrls: ["./edit-url.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatTooltipModule],
  providers: [{ provide: MatFormFieldControl, useExisting: EditUrlComponent }],
})
export class EditUrlComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  ngOnInit() {
    this.formControl.valueChanges.subscribe((value) =>
      this.processUrlInput(value),
    );
  }

  /**
   * Ensures the URL starts with 'http://' or 'https://' while preventing duplication.
   */
  private processUrlInput(value: string): void {
    if (!value) return;

    let newValue = value.trim();

    if (newValue.startsWith("http://") || newValue.startsWith("https://")) {
      // if newValue has valid prefix, don't modify
    } else if (newValue.includes("://")) {
      // replace the prefix 'https://'
      newValue = "https://" + newValue.substring(newValue.indexOf("://") + 3);
    } else if ("https://".startsWith(newValue) && newValue.length > 1) {
      // delete the whole prefix if the user is deleting the prefix
      newValue = "";
    } else {
      newValue = "https://" + newValue;
    }

    if (this.formControl.value === newValue) {
      // nothing changed, don't update the form control
      return;
    }

    this.formControl.setValue(newValue, { emitEvent: false });

    const urlPattern =
      /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;
    this.formControl.setErrors(
      urlPattern.test(newValue) ? null : { invalid: true },
    );
  }

  /**
   * Opens the URL in a new tab if the input field is disabled.
   */
  openLinkIfDisabled(event?: Event) {
    if (this.formControl.disabled && this.formControl.value) {
      // Prevent any default behavior and stop propagation
      event?.preventDefault();
      event?.stopPropagation();
      window.open(this.formControl.value, "_blank");
    }
  }
}
