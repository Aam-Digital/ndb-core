import { EntityTypeLabelPipe } from "./entity-type-label.pipe";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { TestBed } from "@angular/core/testing";

describe("EntityTypeLabelPipeEntity", () => {
  class EntityTypeLabelPipeEntity extends Entity {
    static override ENTITY_TYPE = "TestEntity";
    static override label = "test record";
    static override labelPlural = "test records";
  }

  let pipe: EntityTypeLabelPipe;
  let entityRegistry: EntityRegistry;

  beforeEach(() => {
    entityRegistry = new EntityRegistry();
    entityRegistry.add(
      EntityTypeLabelPipeEntity.ENTITY_TYPE,
      EntityTypeLabelPipeEntity,
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        EntityTypeLabelPipe,
      ],
    });
    pipe = TestBed.inject(EntityTypeLabelPipe);
  });

  it("returns entity-type label for a valid type/prefix", () => {
    expect(pipe.transform(EntityTypeLabelPipeEntity.ENTITY_TYPE)).toBe(
      EntityTypeLabelPipeEntity.label,
    );
  });

  it("returns entity-type label plural if flag given", () => {
    expect(pipe.transform(EntityTypeLabelPipeEntity.ENTITY_TYPE, true)).toBe(
      EntityTypeLabelPipeEntity.labelPlural,
    );
  });

  it("throws error on invalid entity type", () => {
    expect(() => pipe.transform("unknown type")).toThrow();
  });
});
