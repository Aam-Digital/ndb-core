import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { NgIf } from "@angular/common";

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
  openLinkIfDisabled() {
    if (this.formControl.disabled && this.formControl.value) {
      window.open(this.formControl.value, "_blank");
    }
  }
}
