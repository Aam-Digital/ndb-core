import { EntitySchemaDatatype } from "../../entity/schema/entity-schema-datatype";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnum,
  ConfigurableEnumValue,
} from "../configurable-enum.interface";
import { ConfigService } from "../../config/config.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

export class ConfigurableEnumDatatype
  implements EntitySchemaDatatype<ConfigurableEnumValue> {
  public readonly name = "configurable-enum";

  constructor(private configService: ConfigService) {}

  /**
   * transforms Objects of InteractionType to strings to save in DB
   * @param value Object to be saved as specified in config file; e.g. `{id: 'CALL', label:'Phone Call', color:'#FFFFFF'}`
   */
  public transformToDatabaseFormat(value: ConfigurableEnumValue): string {
    return value.id;
  }

  /**
   * transforms saved strings from the DB to Objects of InteractionType
   * @param value string from database as specified in config file; e.g. 'PHONE_CALL'
   * @param schemaField
   */
  public transformToObjectFormat(
    value: string,
    schemaField: EntitySchemaField
  ): ConfigurableEnumValue {
    if (value) {
      return this.configService
        .getConfig<ConfigurableEnum>(
          CONFIGURABLE_ENUM_CONFIG_PREFIX + schemaField.innerDataType
        )
        .find((option) => option.id === value);
    } else {
      return undefined;
    }
  }
}
