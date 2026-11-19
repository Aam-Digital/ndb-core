import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Entity } from "../../../core/entity/model/entity";
import { createWhiteboardItem } from "./whiteboard-item";
import { getReferenceConnections } from "./whiteboard-reference-connections";

describe("getReferenceConnections", () => {
  function entitiesById(...entities: Entity[]) {
    return new Map(entities.map((e) => [e.getId(), e]));
  }

  it("connects cards whose records reference each other through entity fields, labelled with the field", () => {
    // TestEntity.ref is an `entity` field (single), refMixed an array of references
    const target = TestEntity.create({ name: "target" });
    const other = TestEntity.create({ name: "other" });
    const source = TestEntity.create({
      name: "source",
      ref: target.getId(),
      refMixed: [other.getId(), "Child:not-on-board"],
    });
    const sourceCard = createWhiteboardItem.entity(source.getId(), {
      x: 0,
      y: 0,
    });
    const targetCard = createWhiteboardItem.entity(target.getId(), {
      x: 0,
      y: 0,
    });
    const otherCard = createWhiteboardItem.entity(other.getId(), {
      x: 0,
      y: 0,
    });

    const connections = getReferenceConnections(
      [
        sourceCard,
        targetCard,
        otherCard,
        createWhiteboardItem.note({ x: 0, y: 0 }),
      ],
      entitiesById(source, target, other),
    );

    expect(connections).toEqual([
      expect.objectContaining({
        fromItemId: sourceCard.id,
        toItemId: targetCard.id,
        label: TestEntity.schema.get("ref").label,
        isReference: true,
      }),
      expect.objectContaining({
        fromItemId: sourceCard.id,
        toItemId: otherCard.id,
        isReference: true,
      }),
    ]);
  });

  it("skips cards whose record is not loaded and does not connect a card to itself", () => {
    const self = TestEntity.create({ name: "self" });
    self.ref = self.getId();
    const selfCard = createWhiteboardItem.entity(self.getId(), { x: 0, y: 0 });
    const missingCard = createWhiteboardItem.entity("Child:missing", {
      x: 0,
      y: 0,
    });

    expect(
      getReferenceConnections([selfCard, missingCard], entitiesById(self)),
    ).toEqual([]);
  });

  it("connects every card of the same record when it is placed twice", () => {
    const target = TestEntity.create({ name: "target" });
    const source = TestEntity.create({ name: "source", ref: target.getId() });
    const sourceCard = createWhiteboardItem.entity(source.getId(), {
      x: 0,
      y: 0,
    });
    const targetCards = [
      createWhiteboardItem.entity(target.getId(), { x: 0, y: 0 }),
      createWhiteboardItem.entity(target.getId(), { x: 500, y: 0 }),
    ];

    const connections = getReferenceConnections(
      [sourceCard, ...targetCards],
      entitiesById(source, target),
    );

    expect(connections.map((c) => c.toItemId)).toEqual(
      targetCards.map((c) => c.id),
    );
  });
});
