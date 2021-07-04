import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigService } from "../config/config.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { ConfigurableEnumDatatype } from "./configurable-enum-datatype/configurable-enum-datatype";
import { ConfigurableEnumDirective } from "./configurable-enum-directive/configurable-enum.directive";
import { EditConfigurableEnumComponent } from "./edit-configurable-enum/edit-configurable-enum.component";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum/display-configurable-enum.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

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
@NgModule({
  declarations: [
    ConfigurableEnumDirective,
    EditConfigurableEnumComponent,
    DisplayConfigurableEnumComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  exports: [ConfigurableEnumDirective],
  entryComponents: [
    EditConfigurableEnumComponent,
    DisplayConfigurableEnumComponent,
  ],
})
export class ConfigurableEnumModule {
  constructor(
    private configService: ConfigService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.entitySchemaService.registerSchemaDatatype(
      new ConfigurableEnumDatatype(configService)
    );
  }
}
