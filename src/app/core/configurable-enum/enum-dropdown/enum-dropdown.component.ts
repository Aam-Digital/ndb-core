import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { NgForOf, NgIf } from "@angular/common";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../configurable-enum.interface";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { ConfigService } from "../../config/config.service";

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
    BasicAutocompleteComponent,
  ],
})
export class EnumDropdownComponent implements OnChanges {
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;
  @Input() enumId: string;
  @Input() multi = false;

  enumOptions: ConfigurableEnumValue[] = [];
  invalidOptions: ConfigurableEnumValue[] = [];
  options: ConfigurableEnumValue[];
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  createNewOption = (name: string) => {
    const option = { id: name, label: name };
    // TODO this has to be saved to DB
    this.options.push(option);
    return option;
  };

  constructor(private configService: ConfigService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("enumId")) {
      // TODO: automatic checking for prefix would be handled automatically if enumConfigs become entities
      this.enumOptions = this.configService.getConfig<ConfigurableEnumConfig>(
        CONFIGURABLE_ENUM_CONFIG_PREFIX + this.enumId
      );
    }
    if (changes.hasOwnProperty("enumId") || changes.hasOwnProperty("form")) {
      this.invalidOptions = this.prepareInvalidOptions();
    }
    this.options = [...this.enumOptions, ...this.invalidOptions];
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
