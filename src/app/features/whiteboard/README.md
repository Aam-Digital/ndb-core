# Whiteboard

A free-form canvas on which users arrange cards of any records (children, schools, notes, tasks, ...),
see how those records reference each other and add their own annotations: sticky notes, text labels,
groupings and connections. It is a visual working view next to the list and details views, for example to map
the family and support network of a child, to prepare a case conference or to plan a project with its participants.

Each whiteboard is a record of its own (`Whiteboard` entity type), so boards are synced, permission-checked,
archived and listed like any other record.

## UX

### Where it lives

- **List view** (`view:whiteboard`): a standard `EntityList` of all boards. "Add New" opens an empty board
  that first asks for a title and is saved right away; clicking a row opens the board.
- **Board view** (`view:whiteboard/:id`): the custom `Whiteboard` component replaces the generic
  `EntityDetails` for this entity type. It shows the title in the view header, the entity actions menu
  (archive, delete, ...) and the canvas as the whole page content.
- The default views are added by a config migration (`add-default-whiteboard-views.ts`), so no deployment
  has to configure them. The navigation menu entry (`{ "entityType": "Whiteboard" }`) is part of the
  all-features base config and can be added to any instance through the admin menu editor.

### Working on the board

- **Toolbar** (top of the canvas): add record, add note, add text, add group, toggle reference lines,
  and a save indicator ("Saving…" / "All changes saved"). The zoom buttons (in / out / fit) are in the
  bottom corner of the canvas.
- **Cards** are dragged with the mouse or touch. The canvas pans by dragging the empty background and zooms
  with the zoom buttons or Ctrl/⌘ + scroll wheel (which includes pinching on a trackpad). Pinch zoom on a
  touch screen is not supported.
- **Record cards** show the record's icon and name (the shared `app-entity-block`, including its details
  tooltip). The card menu offers: open the record, add the records it is linked to, connect to another
  card, remove it from the board (removing never changes the record itself).
- **Reference lines** are derived, not stored: whenever two cards on the board reference each other through
  an `entity` field (e.g. a note's "children" field, a task's "related records"), a dashed line with the field
  label connects them. They update automatically when the records change. They can be hidden with the
  toolbar toggle.
- **Annotations** are stored with the board:
  - _Note_: a coloured sticky note with free text.
  - _Text_: a plain label without background, e.g. a heading for an area.
  - _Group_: a resizable, titled rectangle drawn behind the cards to group them visually. (Cards inside a
    group are not moved together with it; this keeps the interaction model simple for a first version.)
  - _Connection_: a solid line between any two items, with an optional label, created through
    "Connect to…" in the item menu and then clicking the target.
- Every item has a context menu (the "…" button) with edit, colour and delete actions. Notes, texts, group
  titles and connection labels are edited in a small text dialog.

### Saving

Changes are saved automatically, about half a second after the last change (debounced), and the toolbar shows
the save state. This deliberately differs from the "Edit → Save" convention of forms (see the
[UX guidelines](../../../../doc/compodoc_sources/concepts/ux-guidelines.md)): a canvas has no natural
"form" to confirm, and losing an arrangement of dozens of cards on navigation would be worse than an
unwanted move. A change that is still waiting for its debounced save is
**not** registered with `UnsavedChangesService`: leaving the view flushes the pending save, so there is
nothing to discard and no confirmation is shown (a "discard changes?" prompt would be misleading, because
the change is kept either way). Only when a save fails ("Saving failed") is the board registered with
`UnsavedChangesService`, so navigating away or closing the tab asks for confirmation before the unsaved
arrangement is lost. The registration is cleared by the next successful save and when the view is destroyed.

Users without `update` permission on `Whiteboard` see the board read-only: the toolbar and the
drag handles are disabled, cards can still be opened.

## Known limitations

- Card references are stored as ids inside `items`, not as `entity` fields of the board. Deleting or
  anonymizing a record therefore does not cascade to boards (its card shows a placeholder), and the
  related-records panels of a record do not list the boards it appears on.
- Groups do not move the cards they visually contain.
- If two users edit the same board concurrently, one of the saves can fail with a conflict; this is shown
  as "Saving failed" and the board stays unsaved in that browser until the next successful save.

## Data model

`Whiteboard` (`model/whiteboard.ts`) extends `Entity` with

- `title` (string, shown in lists and the header)
- `items: WhiteboardItem[]` (`model/whiteboard-item.ts`), a list of positioned items with a discriminated
  `type`:

| type         | specific fields                            | notes                                                      |
| ------------ | ------------------------------------------ | ---------------------------------------------------------- |
| `entity`     | `entityId` (prefixed id, e.g. `Child:123`) | the record itself is loaded at runtime, nothing duplicated |
| `note`       | `text`, `color`, `width`, `height`         | sticky note                                                |
| `text`       | `text`                                     | plain label                                                |
| `group`      | `label`, `color`, `width`, `height`        | rendered behind all other items                            |
| `connection` | `fromItemId`, `toItemId`, `label`          | manual line between two items; has no position of its own  |

All positioned items share `id`, `x` and `y` (board coordinates, independent of zoom). Reference lines
between records are **not** stored, they are computed from the entity schemas by
`whiteboard-reference-connections.ts`.

## Architecture

```
whiteboard.module.ts                     registers components, entity type, demo data and default views
whiteboard-components.ts                 lazy component registry entries ("Whiteboard")
add-default-whiteboard-views.ts          config migration adding view:whiteboard and view:whiteboard/:id
model/
  whiteboard.ts                          the entity type
  whiteboard-item.ts                     item types, factories and type guards
  whiteboard-geometry.ts                 pure helpers: rect edge intersection, bounds, free positions
  whiteboard-reference-connections.ts    pure helper: derives reference lines from loaded entities
  demo-whiteboard-generator.service.ts   demo data
whiteboard/                              routed view: loads the entity, owns the items state and saving
whiteboard-canvas/                       pan/zoom surface, drag, selection; renders items and lines
whiteboard-item-menu/                    shared "…" menu of an item (edit, colour, connect, delete)
whiteboard-entity-card/                  card for an `entity` item
whiteboard-note/                         note and text items
whiteboard-group/                        group item with resize handle
whiteboard-text-dialog/                  small dialog to edit a text (note, label, title)
add-whiteboard-entity-dialog/            pick a record type and records to add
```

The `WhiteboardComponent` is the only place that knows about persistence: it holds the `items` signal,
applies every change through `updateItems()` and schedules the debounced save. The canvas and the item
components are presentational: they receive items and emit changes (`itemChanged`, `itemRemoved`, ...),
so they can be reused e.g. inside a dialog or a dashboard widget later.

Dragging uses Angular CDK `cdkDrag` with `cdkDragFreeDragPosition` and `cdkDragScale` (so dragging works
at any zoom level). Lines are drawn in an SVG layer that shares the canvas transform; the end points are
computed from the measured card sizes (`whiteboard-geometry.ts`), so cards may have any content.

### Extending

- **New item type:** add the interface and factory to `whiteboard-item.ts`, a component rendering it, a
  `@case` in the canvas template and a toolbar action. Items are plain JSON, so old boards keep working.
- **New card actions:** add a menu item to `whiteboard-item-menu` (generic) or the entity card (record
  specific). Actions emit events; the board view decides what to change.
- **Automatic lines from other data** (e.g. attendance, custom relations): extend
  `whiteboard-reference-connections.ts`, which already returns the generic `WhiteboardConnection` shape.
- **Other containers:** the canvas does not depend on the route or the entity; a dashboard widget could
  render a board with `<app-whiteboard-canvas [items]="..." readonly />`.

## Implementation options considered

Rendering a whiteboard with Angular components for the cards was the main requirement: a card must be
able to host `app-entity-block`, menus and tooltips, which rules out pure canvas renderers.

| Option                                         | Assessment                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Angular CDK drag-drop + SVG lines (chosen)** | Already a dependency; `cdkDrag` supports free positioning and a `scale` for zoomed parents. Pan/zoom is one CSS transform; lines are ~100 lines of SVG. No new dependency, no abstraction between our items and the DOM, fully styleable with Material.               |
| `@foblex/flow`                                 | Angular-native flow editor (nodes, connections, zoom, minimap, layouts). Mature and active, but geared to node/port diagrams; sticky notes and groups would be workarounds, and it adds a large dependency plus its own DOM structure and CSS to fight with Material. |
| `ngx-vflow`                                    | Angular port of the React Flow idea with custom node templates. Smaller community, 0.x API, same diagram-centric model as above.                                                                                                                                      |
| `jsPlumb` community, `leader-line`             | Framework-agnostic line drawing between DOM elements. Imperative, needs manual syncing with Angular change detection and zoom; the community edition is limited and the Angular wrappers are commercial.                                                              |
| `konva` / `fabric.js`, `tldraw`, `excalidraw`  | Canvas renderers (or React-only). Cards would have to be re-implemented as drawings, losing `app-entity-block`, tooltips, menus and accessibility.                                                                                                                    |
| `@swimlane/ngx-graph`                          | Auto-layout graphs; free positioning and annotations are not its purpose.                                                                                                                                                                                             |

The built-in approach keeps the feature small and consistent with the rest of the app; if richer diagram
behaviour (ports, auto-layout, minimap) is needed later, the item model is plain data and could be fed into
one of the flow libraries without changing the entity format.

## Key files

- `model/whiteboard.ts` — `Whiteboard` entity (`title`, `items`)
- `model/whiteboard-item.ts` — item union type, `createWhiteboardItem()` factories, `isPositionedItem()`
- `model/whiteboard-reference-connections.ts` — `getReferenceConnections()` derives lines from entity schemas
- `model/whiteboard-geometry.ts` — `connectRects()`, `getBounds()`, `findFreePosition()`
- `whiteboard/whiteboard.component.ts` — the routed board view (state, autosave, add/remove actions)
- `whiteboard-canvas/whiteboard-canvas.component.ts` — pan, zoom, drag and rendering of items and lines
