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
      if (value) {
        this.processUrlInput(value);
      }
    });
  }

  /**
   * Ensures the URL starts with 'https://' while preventing duplication.
   */
  processUrlInput(value: string): void {
    if (!value) {
      return;
    }

    // Trim leading/trailing spaces
    value = value.trim();

    // If input is just "https://" or "http://", don't modify
    if (value === "https://" || value === "http://") {
      this.formControl.setValue("", { emitEvent: false });
      return;
    }

    // If the user is typing and hasn't added http/https, prepend 'https://'
    let updatedValue =
      value.startsWith("http://") || value.startsWith("https://")
        ? value.replace(/^https?:\/\//, "https://")
        : `https://${value}`;

    // Only update if the value actually changes to prevent unnecessary updates
    if (updatedValue !== value) {
      this.formControl.setValue(updatedValue, { emitEvent: false });
    }
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
