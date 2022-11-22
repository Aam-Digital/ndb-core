import { dateWithAgeEntitySchemaDatatype } from "./datatype-date-with-age";
import { DateWithAge } from "../../../child-dev-project/children/model/dateWithAge";
import moment from "moment";

describe("Schema data type:date-with-age", () => {
  it("should save Date as date-only", () => {
    const date = new DateWithAge("2022-02-01");
    const dateString =
      dateWithAgeEntitySchemaDatatype.transformToDatabaseFormat(date);
    expect(dateString).toBe("2022-02-01");
  });

  it("should parse the date as a DateOfBirth", () => {
    const date =
      dateWithAgeEntitySchemaDatatype.transformToObjectFormat("2022-02-03");
    expect(date).toBeInstanceOf(DateWithAge);
    expect(moment(date).isSame("2022-02-03", "days")).toBeTrue();
  });
});
