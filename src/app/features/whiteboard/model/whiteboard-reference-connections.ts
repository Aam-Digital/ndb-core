import { Entity } from "../../../core/entity/model/entity";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { asArray } from "../../../utils/asArray";
import {
  WhiteboardConnection,
  WhiteboardEntityItem,
  WhiteboardItem,
} from "./whiteboard-item";

/**
 * Derive the lines between record cards from the `entity` fields of the loaded records:
 * whenever a record on the board references another record on the board, they are connected
 * with the field's label.
 *
 * @param items all items of the board (only `entity` items are considered)
 * @param entities the loaded records by their prefixed id; cards whose record is not loaded are skipped
 */
export function getReferenceConnections(
  items: WhiteboardItem[],
  entities: Map<string, Entity>,
): WhiteboardConnection[] {
  const cards = items.filter(
    (item): item is WhiteboardEntityItem => item.type === "entity",
  );
  const cardsByEntityId = new Map<string, WhiteboardEntityItem[]>();
  for (const card of cards) {
    cardsByEntityId.set(card.entityId, [
      ...(cardsByEntityId.get(card.entityId) ?? []),
      card,
    ]);
  }

  const connections: WhiteboardConnection[] = [];
  for (const card of cards) {
    const entity = entities.get(card.entityId);
    if (!entity) {
      continue;
    }
    for (const [fieldId, field] of entity.getSchema().entries()) {
      if (field.dataType !== EntityDatatype.dataType) {
        continue;
      }
      for (const referencedId of asArray(entity[fieldId] ?? [])) {
        for (const target of cardsByEntityId.get(referencedId) ?? []) {
          if (target.id === card.id) {
            continue;
          }
          connections.push({
            fromItemId: card.id,
            toItemId: target.id,
            label: field.label ?? fieldId,
            isReference: true,
          });
        }
      }
    }
  }
  return connections;
}
