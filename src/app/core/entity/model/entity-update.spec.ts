import { Entity } from "./entity";
import { applyUpdate } from "./entity-update";

class TestUpdateEntity extends Entity {
  value: number;

  constructor(id: string, value: number) {
    super(id);
    this.value = value;
  }

  override getType(): string {
    return "TestEntity";
  }
}

describe("entity-update", () => {
  let existingEntities: TestUpdateEntity[] = [];

  beforeEach(() => {
    existingEntities = ["n1", "n2", "n3", "n5"].map(
      (id) => new TestUpdateEntity(id, 1),
    );
  });

  it("updates the entity-list when a new entity should be inserted", () => {
    const newEntities = applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n6", 1),
      type: "new",
    });
    expect(newEntities).toHaveSize(existingEntities.length + 1);
    expect(newEntities.find((e) => e.getId(true) === "n6")).toBeDefined();
  });

  it("updates the entity-list when an existing entity should be updated", () => {
    const indexOfN2 = existingEntities.findIndex((e) => e.getId(true) === "n2");
    const newEntities = applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n2", 2),
      type: "update",
    });
    expect(newEntities).toHaveSize(existingEntities.length);
    expect(newEntities[indexOfN2].value).toBe(2);
  });

  it("deletes an element from the entity-list when an entity should be deleted", () => {
    const oldLength = existingEntities.length;
    const newEntities = applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n2", 3),
      type: "remove",
    });
    expect(newEntities).toHaveSize(oldLength - 1);
    expect(newEntities.findIndex((e) => e.getId(true) === "n2")).toBe(-1);
  });

  it("does not change the list when the passed updated-entity is illegal", () => {
    const newEntities = applyUpdate<TestUpdateEntity>(
      existingEntities,
      undefined,
    );
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not change the list when the passed entity is illegal", () => {
    const newEntities = applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: undefined,
      type: "new",
    });
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not change the list when an updated entity is not in the list", () => {
    const newEntities = applyUpdate<TestUpdateEntity>(
      existingEntities,
      {
        entity: new TestUpdateEntity("n6", 1),
        type: "update",
      },
      false,
    );
    expect(newEntities).toEqual(existingEntities);
  });

  it("does not mutate the original array", () => {
    const original = [...existingEntities];
    applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n7", 1),
      type: "new",
    });
    applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n2", 10),
      type: "update",
    });
    applyUpdate<TestUpdateEntity>(existingEntities, {
      entity: new TestUpdateEntity("n1", 0),
      type: "remove",
    });
    applyUpdate<TestUpdateEntity>(existingEntities, undefined);
    expect(existingEntities).toEqual(original);
  });
});
