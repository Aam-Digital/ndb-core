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

    this.formControl.valueChanges.subscribe((value) =>
      this.processUrlInput(value),
    );
  }

  /**
   * Ensures the URL starts with 'https://' while preventing duplication.
   */
  private processUrlInput(value: string): void {
    if (!value) return;

    const trimmedValue = value.trim();
    // If input is just "https://" or "http://", don't modify
    if (trimmedValue === "http://" || trimmedValue === "https://") {
      this.formControl.setValue("", { emitEvent: false });
      return;
    }

    const urlPattern =
      /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;

    // Prepend 'https://' if not already present
    if (!/^https?:\/\//.test(trimmedValue)) {
      this.formControl.setValue(`https://${trimmedValue}`, {
        emitEvent: false,
      });
    } else if (trimmedValue.startsWith("http://")) {
      this.formControl.setValue(
        trimmedValue.replace(/^http:\/\//, "https://"),
        { emitEvent: false },
      );
    }
    this.formControl.setErrors(
      urlPattern.test(trimmedValue) ? null : { invalid: true },
    );
  }

  /**
   * Opens the URL in a new tab if the input field is disabled.
   */
  openLinkIfDisabled() {
    if (this.formControl.disabled && this.formControl.value) {
      window.open(this.formControl.value, "_blank");
    }
  }
}
