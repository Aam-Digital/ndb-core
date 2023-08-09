import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { User } from "./user/user";
import { Config } from "./config/config";
import { StringDatatype } from "./entity/schema-datatypes/datatype-string";
import { AbstractDatatype } from "./entity/schema/entity-schema-datatype";
import { SchemaEmbedDatatype } from "./entity/schema-datatypes/datatype-schema-embed";
import { ArrayDatatype } from "./entity/schema-datatypes/datatype-array";
import { MapDatatype } from "./entity/schema-datatypes/datatype-map";
import { MonthDatatype } from "./entity/schema-datatypes/datatype-month";

/**
 * Core module registering basic parts like datatypes and components.
 */
@NgModule({
  providers: [
    // base dataTypes
    { provide: AbstractDatatype, useClass: StringDatatype, multi: true },
    { provide: AbstractDatatype, useClass: SchemaEmbedDatatype, multi: true },
    { provide: AbstractDatatype, useClass: ArrayDatatype, multi: true },
    { provide: AbstractDatatype, useClass: MapDatatype, multi: true },
    { provide: AbstractDatatype, useClass: MonthDatatype, multi: true },
  ],
})
export class CoreModule {
  static databaseEntities = [User, Config];

  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
