import { TestBed } from "@angular/core/testing";

import { EntityAbility } from "./entity-ability";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEmbeddedEntity } from "../../entity/model/embedded-entity";
import { EntityActionPermission } from "../permission-types";

describe("EntityAbility", () => {
  let ability: EntityAbility;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [EntityAbility],
    });
    ability = TestBed.inject(EntityAbility);
  });

  /** grant "read" on TestEntity, restricted by the given conditions */
  function allowReadWhere(conditions: Record<string, any>) {
    ability.update([
      { subject: TestEntity.ENTITY_TYPE, action: "read", conditions },
    ]);
  }

  describe("logical operators in rule conditions", () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = TestEntity.create({
        name: "matching name",
        other: "some other value",
        rating: 10,
      });
    });

    it("should allow access if one branch of a $or condition matches", () => {
      allowReadWhere({
        $or: [{ name: "matching name" }, { other: "not this value" }],
      });

      expect(ability.can("read", entity)).toBe(true);
    });

    it("should deny access if no branch of a $or condition matches", () => {
      allowReadWhere({
        $or: [{ name: "not this name" }, { other: "not this value" }],
      });

      expect(ability.can("read", entity)).toBe(false);
    });

    it("should evaluate a $and condition restricting the same field twice", () => {
      allowReadWhere({
        $and: [{ rating: { $gt: 5 } }, { rating: { $lt: 20 } }],
      });

      expect(ability.can("read", entity)).toBe(true);
    });

    it("should deny access if one part of a $and condition does not match", () => {
      allowReadWhere({
        $and: [{ rating: { $gt: 50 } }, { rating: { $lt: 20 } }],
      });

      expect(ability.can("read", entity)).toBe(false);
    });

    it("should evaluate a $not condition", () => {
      allowReadWhere({ name: { $not: { $eq: "not this name" } } });

      expect(ability.can("read", entity)).toBe(true);
    });

    it("should evaluate a $nor condition", () => {
      allowReadWhere({ $nor: [{ name: "not this name" }] });

      expect(ability.can("read", entity)).toBe(true);
    });

    it("should combine a $or with a sibling condition as an implicit and", () => {
      allowReadWhere({
        other: "some other value",
        $or: [{ name: "matching name" }, { name: "another name" }],
      });

      expect(ability.can("read", entity)).toBe(true);
    });

    it("should still evaluate plain field operators", () => {
      allowReadWhere({ name: { $in: ["matching name"] } });

      expect(ability.can("read", entity)).toBe(true);
      expect(
        ability.can("read", TestEntity.create({ name: "another name" })),
      ).toBe(false);
    });
  });

  describe("invalid conditions", () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = TestEntity.create({ name: "matching name", rating: 10 });
    });

    it("should deny rather than throw for an empty logical array", () => {
      allowReadWhere({ $or: [] });

      expect(() => ability.can("read", entity)).not.toThrow();
      expect(ability.can("read", entity)).toBe(false);
    });

    it("should deny rather than throw for a nested empty logical array", () => {
      allowReadWhere({ $or: [{ $and: [] }] });

      expect(() => ability.can("read", entity)).not.toThrow();
      expect(ability.can("read", entity)).toBe(false);
    });

    it("should deny rather than throw when a logical operator is not an array", () => {
      allowReadWhere({ $or: "not an array" as any });

      expect(() => ability.can("read", entity)).not.toThrow();
      expect(ability.can("read", entity)).toBe(false);
    });

    it("should still apply a valid rule when another rule for the same subject is invalid", () => {
      ability.update([
        {
          subject: TestEntity.ENTITY_TYPE,
          action: "read",
          conditions: { name: "matching name" },
        },
        {
          subject: TestEntity.ENTITY_TYPE,
          action: "read",
          conditions: { $or: [] },
        },
      ]);

      expect(() => ability.can("read", entity)).not.toThrow();
      expect(ability.can("read", entity)).toBe(true);
    });

    it("should not widen access when an inverted rule has invalid conditions", () => {
      ability.update([
        { subject: TestEntity.ENTITY_TYPE, action: "read" },
        {
          subject: TestEntity.ENTITY_TYPE,
          action: "read",
          inverted: true,
          conditions: { $or: [] },
        },
      ]);

      expect(() => ability.can("read", entity)).not.toThrow();
      // the restriction cannot be evaluated, so it must not silently disappear
      expect(ability.can("read", entity)).toBe(false);
    });
  });
  describe("create checks against logical conditions", () => {
    const entity = TestEntity.create({ name: "other name" });

    beforeEach(() => {
      ability.update([
        {
          subject: TestEntity.ENTITY_TYPE,
          action: "create",
          conditions: { $or: [{ name: "required name" }, { other: "x" }] },
        },
      ]);
    });

    it("should ignore logical conditions when checking create", () => {
      // a new entity cannot fulfil the conditions yet
      expect(ability.can("create", entity)).toBe(true);
    });

    it("should evaluate logical conditions when they are explicitly enforced", () => {
      expect(ability.can("create", entity, undefined, true)).toBe(false);
      expect(
        ability.can(
          "create",
          TestEntity.create({ name: "required name" }),
          undefined,
          true,
        ),
      ).toBe(true);
    });
  });

  describe("embedded entries", () => {
    const innerSchema = new Map([["documentNumber", { dataType: "string" }]]);

    function entryOf(record: TestEntity) {
      return createEmbeddedEntity(innerSchema, {
        record,
        field: "other",
        existing: true,
      });
    }

    it.each<
      [string, EntityActionPermission, boolean, EntityActionPermission, boolean]
    >([
      ["changing", "update", true, "update", true],
      ["deleting", "delete", true, "update", true],
      ["reading", "read", true, "read", true],
      ["reading", "read", true, "update", false],
      ["adding to a new record", "create", false, "create", true],
      ["adding to a new record", "create", false, "update", false],
    ])(
      "checks %s an entry against the field of the record holding it (%s on existing record: %s, allowed %s: %s)",
      (_, action, recordExists, allowedAction, expected) => {
        ability.update([
          {
            subject: TestEntity.ENTITY_TYPE,
            action: allowedAction,
            fields: ["other"],
          },
        ]);
        const record = TestEntity.create({ _rev: recordExists ? "1-a" : "" });

        expect(ability.can(action, entryOf(record), "documentNumber")).toBe(
          expected,
        );
        expect(ability.cannot(action, entryOf(record), "documentNumber")).toBe(
          !expected,
        );
      },
    );

    it("denies changing an entry without permission for the field holding it", () => {
      ability.update([
        { subject: TestEntity.ENTITY_TYPE, action: "update", fields: ["name"] },
      ]);
      const record = TestEntity.create({ _rev: "1-a" });

      expect(ability.can("update", entryOf(record), "documentNumber")).toBe(
        false,
      );
    });

    it("checks a nested entry against the field of the outermost record", () => {
      ability.update([
        {
          subject: TestEntity.ENTITY_TYPE,
          action: "update",
          fields: ["other"],
        },
      ]);
      const outerEntry = entryOf(TestEntity.create({ _rev: "1-a" }));
      const nestedEntry = createEmbeddedEntity(innerSchema, {
        record: outerEntry,
        field: "documentNumber",
        existing: false,
      });

      expect(ability.can("create", nestedEntry)).toBe(true);
    });
  });
});
