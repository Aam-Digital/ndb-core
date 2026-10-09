import { permissionConditionsMatcher } from "../../permissions/ability/entity-ability";
import {
  buildConditions,
  normalizeConditions,
  parseConditions,
} from "./conditions-combinator";

describe("conditions combinator helpers", () => {
  describe("parseConditions", () => {
    it.each([
      ["nothing", undefined],
      ["null", null],
      ["a string", "x"],
      ["an array", [{ a: 1 }]],
      ["an empty object", {}],
      ["an empty $or", { $or: [] }],
    ])("should read %s as an empty condition", (_label, stored) => {
      expect(parseConditions(stored)).toEqual({ combinator: "all", rows: [] });
    });

    it("should read an $or array as any", () => {
      expect(parseConditions({ $or: [{ a: 1 }, { b: 2 }] })).toEqual({
        combinator: "any",
        rows: [{ a: 1 }, { b: 2 }],
      });
    });

    it("should not let an $or without a filled-in row decide the combinator", () => {
      // a section can be seeded with one blank row, which must not force "any"
      expect(parseConditions({ $or: [{}] })).toEqual({
        combinator: "all",
        rows: [{}],
      });
      expect(parseConditions({ $or: [{ a: 1 }, {}] }).combinator).toBe("any");
    });

    it("should read an $and array as all", () => {
      expect(parseConditions({ $and: [{ a: 1 }, { a: 2 }] })).toEqual({
        combinator: "all",
        rows: [{ a: 1 }, { a: 2 }],
      });
    });

    it("should read a flat object as all, one row per key", () => {
      expect(parseConditions({ center: "x", gender: "m" })).toEqual({
        combinator: "all",
        rows: [{ center: "x" }, { gender: "m" }],
      });
    });

    it("should fold a sibling key into a row instead of dropping it", () => {
      expect(
        parseConditions({ status: "active", $or: [{ a: 1 }, { b: 2 }] }),
      ).toEqual({
        combinator: "any",
        rows: [{ a: 1 }, { b: 2 }, { status: "active" }],
      });
      expect(
        parseConditions({ status: "active", $and: [{ a: 1 }, { b: 2 }] }),
      ).toEqual({
        combinator: "all",
        rows: [{ a: 1 }, { b: 2 }, { status: "active" }],
      });
    });

    it("should drop rows that are not plain objects", () => {
      expect(parseConditions({ $or: [null, "x", [1], { a: 1 }] }).rows).toEqual(
        [{ a: 1 }],
      );
    });

    it("should not hand out the caller's objects", () => {
      const stored = { $or: [{ a: { $in: [1] } }] };

      parseConditions(stored).rows[0].a.$in.push(2);

      expect(stored).toEqual({ $or: [{ a: { $in: [1] } }] });
    });
  });

  describe("buildConditions", () => {
    it.each([
      ["no rows", []],
      ["an empty row", [{}]],
      ["a null value", [{ a: null }]],
      ["an undefined value", [{ a: undefined }]],
    ])("should build {} from %s", (_label, rows) => {
      expect(buildConditions("any", rows)).toEqual({});
      expect(buildConditions("all", rows)).toEqual({});
    });

    it("should wrap the rows in $or for any, even a single one", () => {
      expect(buildConditions("any", [{ a: 1 }])).toEqual({ $or: [{ a: 1 }] });
      expect(buildConditions("any", [{ a: 1 }, { b: 2 }])).toEqual({
        $or: [{ a: 1 }, { b: 2 }],
      });
    });

    it("should merge rows with unique fields into one object for all", () => {
      expect(buildConditions("all", [{ a: 1 }])).toEqual({ a: 1 });
      expect(buildConditions("all", [{ a: 1 }, { b: 2 }])).toEqual({
        a: 1,
        b: 2,
      });
    });

    it("should fall back to $and for all when a field repeats", () => {
      expect(buildConditions("all", [{ a: 1 }, { a: 2 }])).toEqual({
        $and: [{ a: 1 }, { a: 2 }],
      });
    });

    it("should leave incomplete rows out", () => {
      expect(buildConditions("any", [{ a: 1 }, {}, { b: null }])).toEqual({
        $or: [{ a: 1 }],
      });
    });

    it("should not share objects with its input", () => {
      const rows = [{ a: { $in: [1] } }];

      const built = buildConditions("any", rows);
      rows[0].a.$in.push(2);

      expect(built).toEqual({ $or: [{ a: { $in: [1] } }] });
    });
  });

  describe("normalizeConditions", () => {
    it.each([
      ["any", { $or: [{ a: 1 }, { b: 2 }] }],
      ["any with one row", { $or: [{ a: 1 }] }],
      ["all merged", { a: 1, b: 2 }],
      ["all with a repeated field", { $and: [{ a: 1 }, { a: 2 }] }],
    ])("should leave a stored %s condition unchanged", (_label, stored) => {
      expect(normalizeConditions(stored)).toEqual(stored);
    });

    it("should merge an $and with unique fields into one object", () => {
      expect(normalizeConditions({ $and: [{ a: 1 }, { b: 2 }] })).toEqual({
        a: 1,
        b: 2,
      });
    });

    it("should normalize an empty condition to {}", () => {
      expect(normalizeConditions(undefined)).toEqual({});
    });
  });

  describe("shapes the matcher can evaluate", () => {
    // the editor's output is later evaluated with the same operators, so each
    // shape it can emit has to compile and mean what the combinator says
    const matches = (conditions: any, doc: any) =>
      permissionConditionsMatcher(conditions)(doc);

    it("should evaluate any as a union", () => {
      const conditions = buildConditions("any", [{ a: 1 }, { b: 2 }]);

      expect(matches(conditions, { a: 1, b: 0 })).toBe(true);
      expect(matches(conditions, { a: 0, b: 2 })).toBe(true);
      expect(matches(conditions, { a: 0, b: 0 })).toBe(false);
    });

    it("should evaluate all with unique fields as an intersection", () => {
      const conditions = buildConditions("all", [{ a: 1 }, { b: 2 }]);

      expect(matches(conditions, { a: 1, b: 2 })).toBe(true);
      expect(matches(conditions, { a: 1, b: 0 })).toBe(false);
    });

    it("should evaluate all with a repeated field as an intersection", () => {
      const conditions = buildConditions("all", [
        { tags: { $elemMatch: { $eq: "x" } } },
        { tags: { $elemMatch: { $eq: "y" } } },
      ]);

      expect(matches(conditions, { tags: ["x", "y"] })).toBe(true);
      expect(matches(conditions, { tags: ["x"] })).toBe(false);
    });

    it("should evaluate a negated row inside all", () => {
      const conditions = buildConditions("all", [
        { a: 1 },
        { b: { $not: { $eq: 2 } } },
      ]);

      expect(matches(conditions, { a: 1, b: 3 })).toBe(true);
      expect(matches(conditions, { a: 1, b: 2 })).toBe(false);
    });
  });
});
