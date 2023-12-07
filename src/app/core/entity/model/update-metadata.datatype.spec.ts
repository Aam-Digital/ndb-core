import { testDatatype } from "../schema/entity-schema.service.spec";
import { UpdateMetadataDatatype } from "./update-metadata.datatype";
import { UpdateMetadata } from "./update-metadata";
import moment from "moment";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { StringDatatype } from "../../basic-datatypes/string/string.datatype";

describe("Schema data type: update-metadata", () => {
  testDatatype(
    UpdateMetadataDatatype,
    new UpdateMetadata("tester", moment("2023-12-06T14:25:43.976Z").toDate()),
    {
      by: "tester",
      at: moment("2023-12-06T14:25:43.976Z").toDate(), // DateDatatype currently does not explicitly convert to ISO or any database format
    },
    undefined,
    [
      { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
      { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
    ],
  );
});
