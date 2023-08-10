import { DefaultDatatype } from "../../entity/schema/datatype-default";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { Injectable } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay";
import { EnumValueMappingComponent } from "../../../features/import/import-column-mapping/enum-value-mapping/enum-value-mapping.component";
import { ColumnMapping } from "../../../features/import/column-mapping";

@Injectable()
export class ConfigurableEnumDatatype extends DefaultDatatype {
  static dataType = "configurable-enum";

  public readonly viewComponent = "DisplayConfigurableEnum";
  public readonly editComponent = "EditConfigurableEnum";

  constructor(private enumService: ConfigurableEnumService) {
    super();
  }

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
    let enumId = schemaField.additional || schemaField.innerDataType;
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

  importConfigComponent: ComponentType<any> = EnumValueMappingComponent;

  importMapFunction(
    val,
    schema: EntitySchemaField,
    additional: { [key: string]: any },
  ): any {
    return this.transformToObjectFormat(additional?.[val], schema);
  }

  importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return getUnmappedValuesCounterBadge(col);
  }
}

export function getUnmappedValuesCounterBadge(col: ColumnMapping) {
  if (!col.additional) {
    return "?";
  }
  const unmappedValues = Object.values(col.additional).filter(
    (v) => v === undefined,
  );
  if (unmappedValues.length > 0) {
    return unmappedValues.length.toString();
  }
  return undefined;
}
