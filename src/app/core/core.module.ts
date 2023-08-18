import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { User } from "./user/user";
import { Config } from "./config/config";
import { StringDatatype } from "./entity/schema-datatypes/string.datatype";
import { DefaultDatatype } from "./entity/schema/default.datatype";
import { SchemaEmbedDatatype } from "./entity/schema-datatypes/schema-embed.datatype";
import { ArrayDatatype } from "./entity/schema-datatypes/array.datatype";
import { MapDatatype } from "./entity/schema-datatypes/map.datatype";
import { MonthDatatype } from "./entity/schema-datatypes/month.datatype";
import { BooleanDatatype } from "./entity/schema-datatypes/boolean.datatype";
import { DateDatatype } from "./entity/schema-datatypes/date.datatype";
import { DateOnlyDatatype } from "./entity/schema-datatypes/date-only.datatype";
import { DateWithAgeDatatype } from "./entity/schema-datatypes/date-with-age.datatype";
import { EntityDatatype } from "./entity/schema-datatypes/entity.datatype";
import { EntityArrayDatatype } from "./entity/schema-datatypes/entity-array.datatype";
import { NumberDatatype } from "./entity/schema-datatypes/number.datatype";
import { Entity } from "./entity/model/entity";
import { TimePeriod } from "./entity-components/related-time-period-entities/time-period";

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
  static databaseEntities = [Entity, User, Config, TimePeriod];

  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
