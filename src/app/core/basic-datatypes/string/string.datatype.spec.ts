import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { StringDatatype } from "./string.datatype";

describe("Schema data type: string", () => {
  testDatatype(new StringDatatype(), "test", "test");

  describe("anonymize", () => {
    const datatype = new StringDatatype();

    it("should keep only the first character", async () => {
      const result = await datatype.anonymize("John", {} as any, {} as any);
      expect(result).toBe("J");
    });

    it("should handle single character strings", async () => {
      const result = await datatype.anonymize("A", {} as any, {} as any);
      expect(result).toBe("A");
    });

    it("should return null for null value", async () => {
      const result = await datatype.anonymize(null, {} as any, {} as any);
      expect(result).toBeNull();
    });

    it("should return '' for empty value", async () => {
      const result = await datatype.anonymize("", {} as any, {} as any);
      expect(result).toBe("");
    });

    it("should return undefined for undefined value", async () => {
      const result = await datatype.anonymize(undefined, {} as any, {} as any);
      expect(result).toBeUndefined();
    });

    it("should keep only the first character for longer strings", async () => {
      const result = await datatype.anonymize(
        "Hello World",
        {} as any,
        {} as any,
      );
      expect(result).toBe("H");
    });
  });
});
