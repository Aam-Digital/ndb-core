import { migrateNoteAttendance } from "./note-children-attendance-migration";

describe("migrateNoteAttendance", () => {
  it("should rename childrenAttendance to attendance and convert tuples to objects", () => {
    const rawDoc = {
      _id: "Note:abc",
      _rev: "1-xyz",
      subject: "Meeting",
      childrenAttendance: [
        ["Child:112", { status: "PRESENT", remarks: "" }],
        ["Child:113", { status: "ABSENT", remarks: "sick" }],
      ],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result.attendance).toEqual([
      { participant: "Child:112", status: "PRESENT", remarks: "" },
      { participant: "Child:113", status: "ABSENT", remarks: "sick" },
    ]);
    expect(result.childrenAttendance).toBeUndefined();
  });

  it("should preserve all other fields on the document", () => {
    const rawDoc = {
      _id: "Note:abc",
      _rev: "1-xyz",
      subject: "Meeting",
      date: "2024-01-15",
      children: ["Child:112"],
      childrenAttendance: [["Child:112", { status: "PRESENT", remarks: "" }]],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result._id).toBe("Note:abc");
    expect(result._rev).toBe("1-xyz");
    expect(result.subject).toBe("Meeting");
    expect(result.date).toBe("2024-01-15");
    expect(result.children).toEqual(["Child:112"]);
  });

  it("should produce an empty attendance array when childrenAttendance is empty", () => {
    const rawDoc = {
      _id: "Note:abc",
      childrenAttendance: [],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result.attendance).toEqual([]);
    expect(result.childrenAttendance).toBeUndefined();
  });

  it("should not modify documents that are not Notes", () => {
    const rawDoc = {
      _id: "Child:123",
      childrenAttendance: [["Child:112", { status: "PRESENT", remarks: "" }]],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result).toBe(rawDoc);
    expect(result.childrenAttendance).toBeDefined();
    expect(result.attendance).toBeUndefined();
  });

  it("should not modify a Note that has no childrenAttendance field", () => {
    const rawDoc = {
      _id: "Note:abc",
      subject: "Meeting",
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result).toBe(rawDoc);
    expect(result.attendance).toBeUndefined();
  });

  it("should not modify a Note that already has attendance field (already migrated)", () => {
    const rawDoc = {
      _id: "Note:abc",
      attendance: [
        { participant: "Child:112", status: "PRESENT", remarks: "" },
      ],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result).toBe(rawDoc);
    expect(result.childrenAttendance).toBeUndefined();
  });

  it("should handle multiple participants correctly", () => {
    const rawDoc = {
      _id: "Note:multi",
      childrenAttendance: [
        ["Child:112", { status: "PRESENT", remarks: "" }],
        ["Child:113", { status: "ABSENT", remarks: "sick" }],
        ["Child:114", { status: "PRESENT", remarks: "late" }],
      ],
    };

    const result = migrateNoteAttendance(rawDoc);

    expect(result.attendance).toHaveSize(3);
    expect(result.attendance[0].participant).toBe("Child:112");
    expect(result.attendance[1].participant).toBe("Child:113");
    expect(result.attendance[2].participant).toBe("Child:114");
    expect(result.attendance[1].remarks).toBe("sick");
  });

  it("should not mutate the original document", () => {
    const rawDoc = {
      _id: "Note:abc",
      childrenAttendance: [["Child:112", { status: "PRESENT", remarks: "" }]],
    };
    const originalChildrenAttendance = rawDoc.childrenAttendance;

    migrateNoteAttendance(rawDoc);

    expect(rawDoc.childrenAttendance).toBe(originalChildrenAttendance);
    expect((rawDoc as any).attendance).toBeUndefined();
  });

  it("should return unchanged if rawDoc is null or not an object", () => {
    expect(migrateNoteAttendance(null)).toBeNull();
    expect(migrateNoteAttendance(undefined)).toBeUndefined();
    expect(migrateNoteAttendance("string")).toBe("string");
  });
});
