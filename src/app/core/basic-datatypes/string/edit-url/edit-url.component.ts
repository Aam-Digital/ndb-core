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
  private lastValue: string;

  override ngOnInit() {
    super.ngOnInit();
    this.lastValue = this.formControl.value || '';

    this.formControl.valueChanges.subscribe((value) =>
      this.processUrlInput(value),
    );
  }

  /**
   * Ensures the URL starts with 'http://' or 'https://' while preventing duplication.
   */
  private processUrlInput(value: string): void {
    if (!value) return;

    let trimmedValue = value.trim();

    // Check if the user is deleting the URL character by character
    if (this.lastValue.length > trimmedValue.length) {
      this.lastValue = trimmedValue;
      return;
    }

    // Handle specific case where initial value starts with "ttps://"
    if (trimmedValue.startsWith("ttps://")) {
      trimmedValue = `h${trimmedValue}`;
      this.formControl.setValue(trimmedValue, { emitEvent: false });
      this.lastValue = trimmedValue;
      return;
    }

    // Handle specific case where initial value starts with "ttp://"
    if (trimmedValue.startsWith("ttp://")) {
      trimmedValue = `h${trimmedValue}`;
      this.formControl.setValue(trimmedValue, { emitEvent: false });
      this.lastValue = trimmedValue;
      return;
    }

    // If input is just "https://" or "http://", don't modify
    if (trimmedValue === "http://" || trimmedValue === "https://") {
      this.formControl.setValue("", { emitEvent: false });
      this.lastValue = "";
      return;
    }

    const urlPattern =
      /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;

    // Ensure 'http://' or 'https://' is not duplicated
    if (!/^https?:\/\//.test(trimmedValue) && !/^http?:\/\//.test(trimmedValue)) {
      trimmedValue = `http://${trimmedValue}`;
      this.formControl.setValue(trimmedValue, { emitEvent: false });
    } else if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
      this.formControl.setValue(trimmedValue, { emitEvent: false });
    }

    this.lastValue = trimmedValue;

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