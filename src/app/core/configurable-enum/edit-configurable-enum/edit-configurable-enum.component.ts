import { Component } from "@angular/core";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { arrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-array";
import { compareEnums } from "../../../utils/utils";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { NgForOf, NgIf } from "@angular/common";

@DynamicComponent("EditConfigurableEnum")
@Component({
  selector: "app-edit-configurable-enum",
  templateUrl: "./edit-configurable-enum.component.html",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    ConfigurableEnumDirective,
    NgIf,
    NgForOf,
  ],
  standalone: true,
})
export class EditConfigurableEnumComponent extends EditComponent<ConfigurableEnumValue> {
  enumId: string;
  multi = false;
  compareFun = compareEnums;
  invalidOptions: ConfigurableEnumValue[] = [];

  onInitFromDynamicConfig(config: EditPropertyConfig<ConfigurableEnumValue>) {
    super.onInitFromDynamicConfig(config);
    if (config.propertySchema.dataType === arrayEntitySchemaDatatype.name) {
      this.multi = true;
    }
    this.enumId =
      config.formFieldConfig.additional ||
      config.propertySchema.additional ||
      config.propertySchema.innerDataType;

    this.invalidOptions = this.prepareInvalidOptions();
  }

  private prepareInvalidOptions(): ConfigurableEnumValue[] {
    let additionalOptions;
    if (!this.multi && this.formControl.value?.isInvalidOption) {
      additionalOptions = [this.formControl.value];
    }
    if (this.multi) {
      additionalOptions = this.formControl.value?.filter(
        (o) => o.isInvalidOption
      );
    }
    return additionalOptions ?? [];
  }
}
