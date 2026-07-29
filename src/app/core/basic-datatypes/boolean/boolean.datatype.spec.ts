import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { BooleanDatatype } from "./boolean.datatype";

describe("Schema data type: boolean", () => {
  testDatatype(new BooleanDatatype(), true, true);

  it("coerces string/number values to real booleans (import)", () => {
    const datatype = new BooleanDatatype();
    expect(datatype.transformToObjectFormat("true")).toBe(true);
    expect(datatype.transformToObjectFormat("false")).toBe(false);
    expect(datatype.transformToObjectFormat(true)).toBe(true);
    expect(datatype.transformToObjectFormat(false)).toBe(false);
  });
});
