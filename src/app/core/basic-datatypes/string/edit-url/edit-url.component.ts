import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { NgClass, NgIf } from "@angular/common";

@DynamicComponent("EditUrl")
@Component({
  selector: "app-edit-url",
  templateUrl: "./edit-url.component.html",
  styleUrls: ["./edit-url.component.scss"],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ErrorHintComponent,
    NgIf,
    NgClass,
  ],
  standalone: true,
})
export class EditUrlComponent extends EditComponent<string> implements OnInit {
  override ngOnInit() {
    super.ngOnInit();
    this.formControl.valueChanges.subscribe((value) => {
      this.validateUrl(value);
    });
  }

  /**
   * Checks if the current formControl value is a valid URL.
   */
  validateUrl(value: string): void {
    if (!value) {
      this.formControl.setErrors(null);
      return;
    }

    try {
      const url = new URL(value);
      const isValid = url.protocol === "http:" || url.protocol === "https:";

      this.formControl.setErrors(isValid ? null : { invalid: true });
    } catch (e) {
      this.formControl.setErrors({ invalid: true });
    }
  }

  /**
   * Opens the URL in a new tab only if:
   * - The input field is disabled
   */
  openLinkIfDisabled() {
    if (this.formControl.disabled && this.formControl.value) {
      window.open(this.formControl.value, "_blank");
    }
  }
}
