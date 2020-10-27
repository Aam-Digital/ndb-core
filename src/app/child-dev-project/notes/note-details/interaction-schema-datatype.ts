import { EntitySchemaDatatype } from "app/core/entity/schema/entity-schema-datatype";
import { InteractionType, NoteConfig } from "./note-config.interface";

export class InteractionSchemaDatatype
  implements EntitySchemaDatatype<InteractionType> {
  public readonly name = "interaction-type";

  constructor(private interactionTypesFromConfig: NoteConfig) {}

  public transformToDatabaseFormat(value: InteractionType, a, b, c): string {
    return this.getKeyByValue(
      this.interactionTypesFromConfig.InteractionTypes,
      value
    );
  }

  public transformToObjectFormat(value: string, a, b, c): InteractionType {
    if (value) {
      return this.interactionTypesFromConfig.InteractionTypes[value];
    } else {
      return { name: null };
    }
  }

  private getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }
}
