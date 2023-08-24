import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { DateWithAge } from "../../../child-dev-project/children/model/dateWithAge";
import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import moment from "moment";

describe("Schema data type: date-with-age", () => {
  testDatatype(
    new DateWithAgeDatatype(),
    new DateWithAge(moment("2022-02-01").toDate()),
    "2022-02-01",
  );
});
