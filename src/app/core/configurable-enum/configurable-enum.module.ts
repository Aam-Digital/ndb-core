import { NgModule } from "@angular/core";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { ConfigurableEnumDatatype } from "./configurable-enum-datatype/configurable-enum-datatype";
import { ConfigurableEnumService } from "./configurable-enum.service";

/**
 * Provides a generic functionality to define enums (collections of selectable options) in the config database
 * and save them efficiently as `@DatabaseField`s.
 *
 * An enum in the config can look something like this:
 ```
 "enum:interaction-type": [
 {
     "id": "",
     "name": ""
   },
 {
     "id": "HOME_VISIT",
     "name": "Home Visit"
   },
 {
     "id": "GUARDIAN_TALK",
     "name": "Talk with Guardians"
   },
 ]
 ```
 *
 * In an entity a property can then be of this type:
 * `@DatabaseField({ dataType: "configurable-enum", innerDataType: INTERACTION_TYPE_CONFIG_ID }) category: InteractionType;`
 *
 * ConfigurableEnum values can include arbitrary additional properties but must at least have basic properties of `ConfigurableEnumValue` interface.
 * It is best practice to define an interface for more complex value types and define a constant for the enum's config id, e.g.
 ```
 export interface InteractionType extends ConfigurableEnumValue {
  id: string;
  label: string;
  color?: string;
  isMeeting?: boolean;
 }

 export const INTERACTION_TYPE_CONFIG_ID = "interaction-type";
 ```
 *
 * To iterate over all enum values in a template (e.g. to set up a mat-select dropdown) you can use
 * {@link ConfigurableEnumDirective} similar to `*ngFor`.
 */
@NgModule({})
export class ConfigurableEnumModule {
  constructor(
    private enumService: ConfigurableEnumService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.entitySchemaService.registerSchemaDatatype(
      new ConfigurableEnumDatatype(enumService)
    );
    enumService.preLoadEnums();
  }
}
