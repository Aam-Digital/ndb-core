import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { User } from "./user/user";
import { Config } from "./config/config";
import { StringDatatype } from "./entity/schema-datatypes/datatype-string";
import { DefaultDatatype } from "./entity/schema/datatype-default";
import { SchemaEmbedDatatype } from "./entity/schema-datatypes/datatype-schema-embed";
import { ArrayDatatype } from "./entity/schema-datatypes/datatype-array";
import { MapDatatype } from "./entity/schema-datatypes/datatype-map";
import { MonthDatatype } from "./entity/schema-datatypes/datatype-month";
import { BooleanDatatype } from "./entity/schema-datatypes/datatype-boolean";
import { DateDatatype } from "./entity/schema-datatypes/datatype-date";
import { DateOnlyDatatype } from "./entity/schema-datatypes/datatype-date-only";
import { DateWithAgeDatatype } from "./entity/schema-datatypes/datatype-date-with-age";
import { EntityDatatype } from "./entity/schema-datatypes/datatype-entity";
import { EntityArrayDatatype } from "./entity/schema-datatypes/datatype-entity-array";
import { NumberDatatype } from "./entity/schema-datatypes/datatype-number";

/**
 * Core module registering basic parts like datatypes and components.
 */
@NgModule({
  providers: [
    // base dataTypes
    { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
    { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
    { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
    { provide: DefaultDatatype, useClass: SchemaEmbedDatatype, multi: true },
    { provide: DefaultDatatype, useClass: ArrayDatatype, multi: true },
    { provide: DefaultDatatype, useClass: MapDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateWithAgeDatatype, multi: true },
    { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
    { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
    { provide: DefaultDatatype, useClass: EntityArrayDatatype, multi: true },
  ],
})
export class CoreModule {
  static databaseEntities = [User, Config];

  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
