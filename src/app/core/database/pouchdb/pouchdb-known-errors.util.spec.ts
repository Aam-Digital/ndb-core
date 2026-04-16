import {
  extractErrorText,
  isKnownMultiTabDatabaseCorruption,
} from "./pouchdb-known-errors.util";

describe("pouchdb-known-errors", () => {
  it("should detect seq index constraint errors", () => {
    const error = new Error(
      "Database has a global failure ConstraintError: Unable to add key to index 'seq': at least one key does not satisfy the uniqueness requirements.",
    );

    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should detect unknown_error from IndexedDB adapter failures", () => {
    const error = {
      message: "unknown_error: Database encountered an unknown error",
    };

    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should not classify unrelated validation errors", () => {
    const error = new Error("validation error: invalid field value");

    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should extract text from arrays and nested causes", () => {
    const nestedError = [
      { reason: "bulkDocs failed" },
      {
        error: {
          message:
            "ConstraintError: Unable to add key to index 'seq': uniqueness requirement",
        },
      },
    ];

    const extracted = extractErrorText(nestedError);
    expect(extracted).toContain("bulkDocs failed");
    expect(extracted).toContain("ConstraintError");
  });
});
