import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { Injectable, inject } from "@angular/core";
import { DiscreteDatatype } from "../../discrete/discrete.datatype";
import { ConfigurableEnumValue } from "../configurable-enum.types";

@Injectable()
export class ConfigurableEnumDatatype extends DiscreteDatatype<
  ConfigurableEnumValue,
  string
> {
  private enumService = inject(ConfigurableEnumService);

  static override dataType = "configurable-enum";
  static override label: string = $localize`:datatype-label:dropdown option`;

  public override readonly viewComponent = "DisplayConfigurableEnum";
  public override readonly editComponent = "EditConfigurableEnum";

  /**
   * transforms Objects of InteractionType to strings to save in DB
   * @param value Object to be saved as specified in config file; e.g. `{id: 'CALL', label:'Phone Call', color:'#FFFFFF'}`
   */
  public transformToDatabaseFormat(value: ConfigurableEnumValue): string {
    return value?.id;
  }

  /**
   * transforms saved strings from the DB to Objects of InteractionType
   * @param value string from database as specified in config file; e.g. 'PHONE_CALL'
   * @param schemaField
   */
  public transformToObjectFormat(
    value: string,
    schemaField: EntitySchemaField,
  ): ConfigurableEnumValue {
    if (value === undefined) {
      return undefined;
    }

    let enumId = schemaField.additional;
    let enumOption = this.enumService
      .getEnumValues(enumId)
      ?.find((option) => option.id === value);
    if (!enumOption) {
      enumOption = this.generateOptionForInvalid(value);
    }

    return enumOption;
  }

  /**
   * Build a dummy option so that invalid values are not lost on the next save and users can manually correct issues.
   * @param optionValue
   * @private
   */
  private generateOptionForInvalid(optionValue: string) {
    return {
      id: optionValue,
      isInvalidOption: true,
      label:
        $localize`:enum option label prefix for invalid id dummy:[invalid option]` +
        " " +
        optionValue,
    };
  }
}
