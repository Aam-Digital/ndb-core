import { EntitySchemaDatatype } from "app/core/entity/schema/entity-schema-datatype";
import {
  InteractionType,
  NoteConfig,
} from "../note-config-loader/note-config.interface";

export class InteractionSchemaDatatype
  implements EntitySchemaDatatype<InteractionType> {
  public readonly name = "interaction-type";

  constructor(private interactionTypesFromConfig: NoteConfig) {}

  /**
   * transforms Objects of InteractionType to strings to save in DB
   * @param value Object to be saved as specefied in config file; e.g. {name:'Phone Call', color:'#FFFFFF'}
   */
  public transformToDatabaseFormat(value: InteractionType): string {
    return this.getKeyByValue(
      this.interactionTypesFromConfig.InteractionTypes,
      value
    );
  }

  /**
   * transforms saved strings from the DB to Objects of InteractionType
   * @param value string from database as specified in config file; e.g. 'PHONE_CALL'
   */
  public transformToObjectFormat(value: string): InteractionType {
    if (value) {
      return this.interactionTypesFromConfig.InteractionTypes[value];
    } else {
      return { name: null };
    }
  }

  /**
   * retrieves the key of the property of object with the provided value by comparing the string representations.
   * @param object object with the key:value-pair we are looking for
   * @param value the value of the property which key we want
   */
  private getKeyByValue(object, value) {
    return Object.keys(object).find(
      (key) => JSON.stringify(object[key]) === JSON.stringify(value)
    );
  }
}
