import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import moment from "moment";
import { DateWithAge } from "./dateWithAge";
import { calculateAge } from "../../../utils/utils";

describe("Schema data type: date-with-age", () => {
  testDatatype(
    new DateWithAgeDatatype(),
    new DateWithAge(moment("2022-02-01").toDate()),
    "2022-02-01",
  );

  it("should export a separate, non-empty age column alongside the date column", async () => {
    const datatype = new DateWithAgeDatatype();
    const schemaField = { id: "dateOfBirth", label: "Date of birth" };
    const value = new DateWithAge(moment("2000-01-01").toDate());

    const columns = datatype.getExportColumns(schemaField);

    const dateColumn = columns.find((c) => c.keySuffix === "");
    const ageColumn = columns.find((c) => c.keySuffix === "_age");
    expect(dateColumn).toBeTruthy();
    expect(ageColumn).toBeTruthy();
    expect(await dateColumn.resolveValue(value, schemaField)).toBe(value);
    expect(await ageColumn.resolveValue(value, schemaField)).toBe(
      calculateAge(value),
    );
  });

  it("should resolve the age column to undefined when no date is set", async () => {
    const datatype = new DateWithAgeDatatype();
    const schemaField = { id: "dateOfBirth", label: "Date of birth" };

    const ageColumn = datatype
      .getExportColumns(schemaField)
      .find((c) => c.keySuffix === "_age");

    expect(
      await ageColumn.resolveValue(undefined, schemaField),
    ).toBeUndefined();
  });
});
