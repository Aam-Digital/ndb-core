import { TestBed } from "@angular/core/testing";

import { EntityAbility } from "./entity-ability";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntityAbility", () => {
  let ability: EntityAbility;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [EntityAbility],
    });
    ability = TestBed.inject(EntityAbility);
  });

  describe("logical operators in rule conditions", () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = TestEntity.create({
        name: "matching name",
        other: "some other value",
        rating: 10,
      });
    });

    function allowReadWhere(conditions: Record<string, any>) {
      ability.update([
        { subject: TestEntity.ENTITY_TYPE, action: "read", conditions },
      ]);
    }

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

    function allowReadWhere(conditions: Record<string, any>) {
      ability.update([
        { subject: TestEntity.ENTITY_TYPE, action: "read", conditions },
      ]);
    }

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
});
