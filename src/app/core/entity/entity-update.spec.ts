import { Entity } from "./entity";
import { update } from "./entity-update";

class TestEntity extends Entity {
  value: number;

  constructor(id: string, value: number) {
    super(id);
    this.value = value;
  }

  getType(): string {
    return "TestEntity";
  }
}

describe("entity-update", () => {
  let existingEntities: TestEntity[] = [];

  beforeEach(() => {
    existingEntities = ["n1", "n2", "n3", "n5"].map(
      (id) => new TestEntity(id, 1)
    );
  });

  it("updates the entity-list when a new entity should be inserted", () => {
    const newEntities = update<TestEntity>(existingEntities, {
      entity: new TestEntity("n6", 1),
      type: "new",
    });
    expect(newEntities.length).toBe(existingEntities.length + 1);
    expect(newEntities.find((e) => e.getId() === "n6")).toBeDefined();
  });

  it("updates the entity-list when an existing entity should be updated", () => {
    const indexOfN2 = existingEntities.findIndex((e) => e.getId() === "n2");
    const newEntities = update<TestEntity>(existingEntities, {
      entity: new TestEntity("n2", 2),
      type: "update",
    });
    expect(newEntities.length).toBe(existingEntities.length);
    expect(newEntities[indexOfN2].value).toBe(2);
  });

  it("deletes an element from the entity-list when an entity should be deleted", () => {
    const oldLength = existingEntities.length;
    const newEntities = update<TestEntity>(existingEntities, {
      entity: new TestEntity("n2", 3),
      type: "remove",
    });
    expect(newEntities.length).toBe(oldLength - 1);
    expect(newEntities.findIndex((e) => e.getId() === "n2")).toBe(-1);
  });

  it("does not change the list when the passed updated-entity is illegal", () => {
    const newEntities = update<TestEntity>(existingEntities, undefined);
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not change the list when the passed entity is illegal", () => {
    const newEntities = update<TestEntity>(existingEntities, {
      entity: undefined,
      type: "new",
    });
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not change the list when an updated entity is not in the list", () => {
    const newEntities = update<TestEntity>(existingEntities, {
      entity: new TestEntity("n6", 1),
      type: "update",
    });
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not mutate the original array", () => {
    const original = [...existingEntities];
    update<TestEntity>(existingEntities, {
      entity: new TestEntity("n7", 1),
      type: "new",
    });
    update<TestEntity>(existingEntities, {
      entity: new TestEntity("n2", 10),
      type: "update",
    });
    update<TestEntity>(existingEntities, {
      entity: new TestEntity("n1", 0),
      type: "remove",
    });
    update<TestEntity>(existingEntities, undefined);
    expect(existingEntities).toEqual(original);
  });

  it("returns the existing entities when an illegal operation is passed", () => {
    const newEntities = update<TestEntity>(existingEntities, {
      entity: new TestEntity("n1", 1),
      type: "illegal",
    });
    expect(newEntities).toEqual(existingEntities);
  });
});
