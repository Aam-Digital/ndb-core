import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { compareEnums } from "../../../utils/utils";
import { NgForOf, NgIf } from "@angular/common";
import { ConfigurableEnumValue } from "../configurable-enum.interface";

@Component({
  selector: "app-enum-dropdown",
  templateUrl: "./enum-dropdown.component.html",
  styleUrls: ["./enum-dropdown.component.scss"],
  standalone: true,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    ConfigurableEnumDirective,
    NgIf,
    NgForOf,
  ],
})
export class EnumDropdownComponent implements OnChanges {
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;
  @Input() enumId: string;
  @Input() multi?: boolean;

  compareFun = compareEnums;
  invalidOptions: ConfigurableEnumValue[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("enumId") || changes.hasOwnProperty("form")) {
      this.invalidOptions = this.prepareInvalidOptions();
    }
  }

  private prepareInvalidOptions(): ConfigurableEnumValue[] {
    let additionalOptions;
    if (!this.multi && this.form.value?.isInvalidOption) {
      additionalOptions = [this.form.value];
    }
    if (this.multi) {
      additionalOptions = this.form.value?.filter((o) => o.isInvalidOption);
    }
    return additionalOptions ?? [];
  }
}
