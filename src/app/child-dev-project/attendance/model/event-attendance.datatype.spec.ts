import { testDatatype } from "../../../core/entity/schema/entity-schema.service.spec";
import { EventAttendanceDatatype } from "./event-attendance.datatype";
import { EventAttendance } from "./event-attendance";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";
import { ConfigurableEnumDatatype } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.service";

describe("Schema data type: event-attendance", () => {
  testDatatype(
    EventAttendanceDatatype,
    new EventAttendance(defaultAttendanceStatusTypes[0], "test remark"),
    {
      status: defaultAttendanceStatusTypes[0].id,
      remarks: "test remark",
    },
    undefined,
    [
      { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
      {
        provide: DefaultDatatype,
        useClass: ConfigurableEnumDatatype,
        multi: true,
      },
      {
        provide: ConfigurableEnumService,
        useValue: { getEnumValues: () => defaultAttendanceStatusTypes },
      },
    ],
  );
});
