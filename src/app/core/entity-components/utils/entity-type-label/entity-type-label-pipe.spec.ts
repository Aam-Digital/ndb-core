import { EntityTypeLabelPipe } from "./entity-type-label.pipe";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";

describe("EntityTypeLabelPipe", () => {
  class TestEntity extends Entity {
    static ENTITY_TYPE = "TestEntity";
    static label = "test record";
    static labelPlural = "test records";
  }

  let pipe: EntityTypeLabelPipe;

  beforeEach(() => {
    const entityRegistry = new EntityRegistry();
    entityRegistry.add(TestEntity.ENTITY_TYPE, TestEntity);
    pipe = new EntityTypeLabelPipe(entityRegistry);
  });

  it("returns entity-type label for a valid type/prefix", () => {
    expect(pipe.transform(TestEntity.ENTITY_TYPE)).toBe(TestEntity.label);
  });

  it("returns entity-type label plural if flag given", () => {
    expect(pipe.transform(TestEntity.ENTITY_TYPE, true)).toBe(
      TestEntity.labelPlural,
    );
  });

  it("throws error on invalid entity type", () => {
    expect(() => pipe.transform("unknown type")).toThrow();
  });
});
