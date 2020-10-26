import { EntitySchemaDatatype } from "app/core/entity/schema/entity-schema-datatype";
import { InteractionType, NoteConfig } from "./note-config.interface";

export class InteractionSchemaDatatype
  implements EntitySchemaDatatype<InteractionType> {
  public readonly name = "interaction-type";

  constructor(private interactionTypesFromConfig: NoteConfig) {}

  public transformToDatabaseFormat(value: InteractionType): string {
    return this.getKeyByValue(
      this.interactionTypesFromConfig.InteractionTypes,
      value
    );
  }

  public transformToObjectFormat(value: string): InteractionType {
    if (value) {
      return this.interactionTypesFromConfig[value];
    } else {
      return { name: "" };
    }
  }

  private getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }
}
