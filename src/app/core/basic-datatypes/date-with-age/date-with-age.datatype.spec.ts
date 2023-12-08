import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import moment from "moment";
import { DateWithAge } from "./dateWithAge";

describe("Schema data type: date-with-age", () => {
  testDatatype(
    new DateWithAgeDatatype(),
    new DateWithAge(moment("2022-02-01").toDate()),
    "2022-02-01",
  );
});
