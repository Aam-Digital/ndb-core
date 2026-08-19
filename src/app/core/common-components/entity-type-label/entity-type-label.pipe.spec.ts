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

  it("falls back to the raw key for an unregistered entity type", () => {
    expect(pipe.transform("unknown type")).toBe("unknown type");
  });

  it("falls back to the raw key for a registered type that has no label", () => {
    // a config-defined type (e.g. "Aser") whose config sets no label: registered,
    // so the unregistered-type fallback does not apply, and the label is empty
    class UnlabelledEntity extends Entity {
      static override ENTITY_TYPE = "Unlabelled";
    }
    entityRegistry.add(UnlabelledEntity.ENTITY_TYPE, UnlabelledEntity);

    expect(pipe.transform("Unlabelled")).toBe("Unlabelled");
    expect(pipe.transform("Unlabelled", true)).toBe("Unlabelled");
  });

  it("keeps labels for known types and falls back to the raw key for unknown types in an array", () => {
    expect(
      pipe.transform([EntityTypeLabelPipeEntity.ENTITY_TYPE, "unknown type"]),
    ).toBe(`${EntityTypeLabelPipeEntity.label} / unknown type`);
  });
});
