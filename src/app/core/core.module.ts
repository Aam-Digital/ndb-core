import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { Config } from "./config/config";
import { StringDatatype } from "./basic-datatypes/string/string.datatype";
import { DefaultDatatype } from "./entity/default-datatype/default.datatype";
import { MonthDatatype } from "./basic-datatypes/month/month.datatype";
import { BooleanDatatype } from "./basic-datatypes/boolean/boolean.datatype";
import { DateDatatype } from "./basic-datatypes/date/date.datatype";
import { DateOnlyDatatype } from "./basic-datatypes/date-only/date-only.datatype";
import { DateWithAgeDatatype } from "./basic-datatypes/date-with-age/date-with-age.datatype";
import { EntityDatatype } from "./basic-datatypes/entity/entity.datatype";
import { NumberDatatype } from "./basic-datatypes/number/number.datatype";
import { Entity } from "./entity/model/entity";
import { TimePeriod } from "./entity-details/related-time-period-entities/time-period";
import { CommonModule } from "@angular/common";
import { LongTextDatatype } from "./basic-datatypes/string/long-text.datatype";
import { UpdateMetadataDatatype } from "./entity/model/update-metadata.datatype";
import { CurrentUserSubject } from "./session/current-user-subject";
import { SessionSubject } from "./session/auth/session-info";
import { PercentageDatatype } from "./basic-datatypes/number/display-percentage/percentage.datatype";
import { UrlDatatype } from "./basic-datatypes/string/url.datatype";

/**
 * Core module registering basic parts like datatypes and components.
 */
@NgModule({
  providers: [
    SessionSubject,
    CurrentUserSubject,
    // base dataTypes
    { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
    { provide: DefaultDatatype, useClass: LongTextDatatype, multi: true },
    { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
    { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
    { provide: DefaultDatatype, useClass: UpdateMetadataDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateWithAgeDatatype, multi: true },
    { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
    { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
    { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
    { provide: DefaultDatatype, useClass: PercentageDatatype, multi: true },
    { provide: DefaultDatatype, useClass: UrlDatatype, multi: true },
  ],
  imports: [CommonModule],
})
export class CoreModule {
  static databaseEntities = [Entity, Config, TimePeriod];

  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(coreComponents);
  }
}
