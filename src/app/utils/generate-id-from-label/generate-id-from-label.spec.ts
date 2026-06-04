import { generateIdFromLabel } from "./generate-id-from-label";

describe("generateIdFromLabel", () => {
  it("should generate sensible ids from labels", () => {
    const labelIdPairs = [
      ["name", "name"],
      ["Name", "name"],
      ["FirstName", "firstName"],
      ["name of", "nameOf"],
      ["test's name", "testsName"],
      ["name 123", "name123"],
      ["123 name", "123Name"], // this is possible in JavaScript
      ["trailing space ", "trailingSpace"],
      ["special chars !@#$%^&*()_+{}|:\"<>?`-=[]\\;',./", "specialChars"],
    ];

    for (const testCase of labelIdPairs) {
      const generatedId = generateIdFromLabel(testCase[0]);
      expect(generatedId).toBe(testCase[1]);
    }
  });
});
