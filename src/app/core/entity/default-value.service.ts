import { Injectable } from "@angular/core";
import { Entity } from "./model/entity";
import { FormGroup } from "@angular/forms";
import { HandleDefaultValuesUseCase } from "./default-field-value/handle-default-values.usecase";

@Injectable({
  providedIn: "root",
})
export class DefaultValueService {
  constructor(private handleDefaultValuesUseCase: HandleDefaultValuesUseCase) {}

  handle(formGroup: FormGroup, entity: Entity): void {
    let schema = entity.getSchema();

    let defaultValueConfigs = Array.from(schema.entries()).filter(
      ([key, fieldSchema]) => {
        return fieldSchema.defaultValue;
      },
    );

    let inheritedConfigs = defaultValueConfigs.filter(
      ([key, fieldSchema]) => fieldSchema.defaultValue.mode == "inherited",
    );

    let nonInheritedConfigs = defaultValueConfigs.filter(
      ([key, fieldSchema]) => fieldSchema.defaultValue.mode != "inherited",
    );

    if (inheritedConfigs.length > 0) {
      // apply inherited rules first, to be sure, that default values are reflected correctly
      this.handleDefaultValuesUseCase.handleFormGroup(
        formGroup,
        inheritedConfigs,
        entity.isNew,
      );
    }

    if (nonInheritedConfigs.length > 0) {
      this.handleDefaultValuesUseCase.handleFormGroup(
        formGroup,
        nonInheritedConfigs,
        entity.isNew,
      );
    }
  }
}
