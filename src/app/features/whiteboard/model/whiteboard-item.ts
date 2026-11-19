import { v4 as uuid } from "uuid";

/**
 * Colours available for notes and groups.
 * Stored by name, so the actual shade can be adjusted in the styles without migrating boards.
 */
export const WHITEBOARD_COLORS = [
  "yellow",
  "green",
  "blue",
  "pink",
  "grey",
] as const;
export type WhiteboardColor = (typeof WHITEBOARD_COLORS)[number];

interface WhiteboardItemBase {
  /** unique within the board */
  id: string;
}

/** An item placed on the canvas, in board coordinates (independent of zoom and pan). */
export interface WhiteboardPositionedItem extends WhiteboardItemBase {
  x: number;
  y: number;
}

/** A card representing a record of any entity type. */
export interface WhiteboardEntityItem extends WhiteboardPositionedItem {
  type: "entity";
  /** prefixed entity id, e.g. `Child:123` */
  entityId: string;
}

/** A coloured sticky note. */
export interface WhiteboardNoteItem extends WhiteboardPositionedItem {
  type: "note";
  text: string;
  color: WhiteboardColor;
  width: number;
  height: number;
}

/** A plain text label without background. */
export interface WhiteboardTextItem extends WhiteboardPositionedItem {
  type: "text";
  text: string;
}

/** A titled rectangle drawn behind the other items to group them visually. */
export interface WhiteboardGroupItem extends WhiteboardPositionedItem {
  type: "group";
  label: string;
  color: WhiteboardColor;
  width: number;
  height: number;
}

/** A manual line between two positioned items. */
export interface WhiteboardConnectionItem extends WhiteboardItemBase {
  type: "connection";
  fromItemId: string;
  toItemId: string;
  label?: string;
}

export type WhiteboardItem =
  | WhiteboardEntityItem
  | WhiteboardNoteItem
  | WhiteboardTextItem
  | WhiteboardGroupItem
  | WhiteboardConnectionItem;

export type WhiteboardPositionedItemType = Exclude<
  WhiteboardItem,
  WhiteboardConnectionItem
>;

export function isPositionedItem(
  item: WhiteboardItem,
): item is WhiteboardPositionedItemType {
  return item.type !== "connection";
}

export function isConnectionItem(
  item: WhiteboardItem,
): item is WhiteboardConnectionItem {
  return item.type === "connection";
}

/**
 * A line to draw between two items on the board.
 * Either stored as a {@link WhiteboardConnectionItem} or derived from entity references.
 */
export interface WhiteboardConnection {
  /** id of the stored connection item, undefined for derived reference lines */
  id?: string;
  fromItemId: string;
  toItemId: string;
  label?: string;
  /** derived from an `entity` field of a record (dashed) rather than drawn by the user */
  isReference: boolean;
}

export const DEFAULT_NOTE_SIZE = { width: 200, height: 120 };
export const DEFAULT_GROUP_SIZE = { width: 400, height: 300 };

/**
 * Create new items with sensible defaults.
 */
export const createWhiteboardItem = {
  entity(
    entityId: string,
    position: { x: number; y: number },
  ): WhiteboardEntityItem {
    return { id: uuid(), type: "entity", entityId, ...position };
  },
  note(position: { x: number; y: number }): WhiteboardNoteItem {
    return {
      id: uuid(),
      type: "note",
      text: "",
      color: "yellow",
      ...DEFAULT_NOTE_SIZE,
      ...position,
    };
  },
  text(position: { x: number; y: number }, text = ""): WhiteboardTextItem {
    return { id: uuid(), type: "text", text, ...position };
  },
  group(position: { x: number; y: number }, label = ""): WhiteboardGroupItem {
    return {
      id: uuid(),
      type: "group",
      label,
      color: "grey",
      ...DEFAULT_GROUP_SIZE,
      ...position,
    };
  },
  connection(
    fromItemId: string,
    toItemId: string,
    label?: string,
  ): WhiteboardConnectionItem {
    return { id: uuid(), type: "connection", fromItemId, toItemId, label };
  },
};
