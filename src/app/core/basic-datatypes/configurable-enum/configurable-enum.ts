import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";
import { Logging } from "../../logging/logging.service";

@DatabaseEntity("ConfigurableEnum")
export class ConfigurableEnum extends Entity {
  @DatabaseField() values: ConfigurableEnumValue[] = [];

  constructor(id?: string, values: ConfigurableEnumValue[] = []) {
    super(id);
    this.values = values;
  }

  /**
   * Add a new valid option to the enum values, if it is not a duplicate or invalid.
   * Returns the newly added option upon success.
   * @param newOptionInput String or option object to be added
   */
  addOption(
    newOptionInput: ConfigurableEnumValue | string,
  ): ConfigurableEnumValue | undefined {
    const option: ConfigurableEnumValue =
      typeof newOptionInput === "string"
        ? this.convertStringToOption(newOptionInput)
        : newOptionInput;

    if (!option || !(option?.id && option?.label)) {
      Logging.debug(
        "Trying to add invalid enum option",
        newOptionInput,
        option,
      );
      return;
    }

    // check for duplicates
    if (this.values.some((v) => v.label === option.label)) {
      throw new DuplicateEnumOptionException(newOptionInput);
    }
    if (this.values.some((v) => v.id === option.id)) {
      option.id = option.id + "_";
    }

    this.values.push(option);
    return option;
  }

  private convertStringToOption(
    newOption: string,
  ): ConfigurableEnumValue | undefined {
    newOption = newOption.trim();
    if (newOption.length === 0) {
      return;
    }

    return {
      id: newOption.toUpperCase(),
      label: newOption,
    };
  }
}

/**
 * Error thrown when trying to add an option that already exists in the enum values.
 */
export class DuplicateEnumOptionException extends Error {
  constructor(newOptionInput) {
    super("Enum Option already exists");

    this["newOptionInput"] = newOptionInput;
  }
}
