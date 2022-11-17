import { dateOfBirthEntitySchemaDatatype } from "./datatype-date-of-birth";
import { DateOfBirth } from "../../../child-dev-project/children/model/dateOfBirth";
import moment from "moment";

describe("Schema data type:DateOfBirth", () => {
  it("should save Date as date-only", () => {
    const date = new DateOfBirth("2022-02-01");
    const dateString =
      dateOfBirthEntitySchemaDatatype.transformToDatabaseFormat(date);
    expect(dateString).toBe("2022-02-01");
  });

  it("should parse the date as a DateOfBirth", () => {
    const date =
      dateOfBirthEntitySchemaDatatype.transformToObjectFormat("2022-02-03");
    expect(date).toBeInstanceOf(DateOfBirth);
    expect(moment(date).isSame("2022-02-03", "days")).toBeTrue();
  });
});
