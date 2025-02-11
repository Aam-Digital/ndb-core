import { Component } from "@angular/core";
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
export class EditUrlComponent extends EditComponent<string> {
  
  /**
   * Checks if the current formControl value is a valid URL.
   * Returns true only if it is a properly formatted http/https URL.
   */
  isValidUrl(value: string | null): boolean {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  /**
   * Opens the URL in a new tab only if:
   * - The input field is disabled
   * - The value is a valid URL
   */
  openLinkIfDisabled() {
    if (this.formControl.disabled && this.isValidUrl(this.formControl.value)) {
      window.open(this.formControl.value, "_blank");
    }
  }
}

