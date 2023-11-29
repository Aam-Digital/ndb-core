import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { CurrentUserSubject, User } from "./user/user";
import { Config } from "./config/config";
import { StringDatatype } from "./basic-datatypes/string/string.datatype";
import { DefaultDatatype } from "./entity/default-datatype/default.datatype";
import { SchemaEmbedDatatype } from "./basic-datatypes/schema-embed/schema-embed.datatype";
import { ArrayDatatype } from "./basic-datatypes/array/array.datatype";
import { MapDatatype } from "./basic-datatypes/map/map.datatype";
import { MonthDatatype } from "./basic-datatypes/month/month.datatype";
import { BooleanDatatype } from "./basic-datatypes/boolean/boolean.datatype";
import { DateDatatype } from "./basic-datatypes/date/date.datatype";
import { DateOnlyDatatype } from "./basic-datatypes/date-only/date-only.datatype";
import { DateWithAgeDatatype } from "./basic-datatypes/date-with-age/date-with-age.datatype";
import { EntityDatatype } from "./basic-datatypes/entity/entity.datatype";
import { EntityArrayDatatype } from "./basic-datatypes/entity-array/entity-array.datatype";
import { NumberDatatype } from "./basic-datatypes/number/number.datatype";
import { Entity } from "./entity/model/entity";
import { TimePeriod } from "./entity-details/related-time-period-entities/time-period";
import { CommonModule } from "@angular/common";
import { LongTextDatatype } from "./basic-datatypes/string/long-text.datatype";

/**
 * Core module registering basic parts like datatypes and components.
 */
@NgModule({
  providers: [
    CurrentUserSubject,
    // base dataTypes
    { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
    { provide: DefaultDatatype, useClass: LongTextDatatype, multi: true },
    { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
    { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
    { provide: DefaultDatatype, useClass: SchemaEmbedDatatype, multi: true },
    { provide: DefaultDatatype, useClass: ArrayDatatype, multi: true },
    { provide: DefaultDatatype, useClass: MapDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateWithAgeDatatype, multi: true },
    { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
    { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
    { provide: DefaultDatatype, useClass: EntityArrayDatatype, multi: true },
  ],
  imports: [CommonModule],
})
export class CoreModule {
  static databaseEntities = [Entity, User, Config, TimePeriod];

  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
