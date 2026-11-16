import {
  afterNextRender,
  Component,
  Injector,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { firstValueFrom, merge } from "rxjs";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { AbstractEntityDetailsComponent } from "../../../core/entity-details/abstract-entity-details/abstract-entity-details.component";
import { EntityActionsMenuComponent } from "../../../core/entity-details/entity-actions-menu/entity-actions-menu.component";
import { EntityArchivedInfoComponent } from "../../../core/entity-details/entity-archived-info/entity-archived-info.component";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { EntityRelationsService } from "../../../core/entity/entity-mapper/entity-relations.service";
import { Entity } from "../../../core/entity/model/entity";
import { getEntityRuntimeRoute } from "../../../core/entity/entity-config.service";
import { Logging } from "../../../core/logging/logging.service";
import { RouteTarget } from "../../../route-target";
import { asArray } from "../../../utils/asArray";
import { AddWhiteboardEntityDialogComponent } from "../add-whiteboard-entity-dialog/add-whiteboard-entity-dialog.component";
import { Whiteboard } from "../model/whiteboard";
import {
  findFreePosition,
  getPositionsAround,
  Point,
} from "../model/whiteboard-geometry";
import {
  createWhiteboardItem,
  DEFAULT_NOTE_SIZE,
  WhiteboardConnection,
  WhiteboardEntityItem,
  WhiteboardItem,
  isConnectionItem,
} from "../model/whiteboard-item";
import { getReferenceConnections } from "../model/whiteboard-reference-connections";
import { WhiteboardCanvasComponent } from "../whiteboard-canvas/whiteboard-canvas.component";
import {
  WhiteboardTextDialogComponent,
  WhiteboardTextDialogData,
  WhiteboardTextDialogResult,
} from "../whiteboard-text-dialog/whiteboard-text-dialog.component";

/** how long after the last change the board is saved */
export const WHITEBOARD_SAVE_DEBOUNCE_MS = 500;
const CARD_SIZE = { width: 220, height: 60 };

/**
 * The routed view of one whiteboard: loads the entity, owns the items state and saves changes automatically.
 */
@RouteTarget("Whiteboard")
@DynamicComponent("Whiteboard")
@Component({
  selector: "app-whiteboard",
  templateUrl: "./whiteboard.component.html",
  styleUrl: "./whiteboard.component.scss",
  imports: [
    MatButtonModule,
    MatTooltipModule,
    FaDynamicIconComponent,
    ViewTitleComponent,
    ViewActionsComponent,
    EntityActionsMenuComponent,
    EntityArchivedInfoComponent,
    WhiteboardCanvasComponent,
  ],
})
export class WhiteboardComponent extends AbstractEntityDetailsComponent {
  private readonly dialog = inject(MatDialog);
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly canvas = viewChild.required(WhiteboardCanvasComponent);

  readonly whiteboard = computed(() => this.entity() as Whiteboard | null);
  readonly items = signal<WhiteboardItem[]>([]);
  readonly showReferences = signal(true);

  /** `pending` while a change waits for its debounced save, `saving` during the save itself */
  readonly saveState = signal<"saved" | "pending" | "saving" | "error">(
    "saved",
  );
  readonly readonly = computed(() => {
    const whiteboard = this.whiteboard();
    return !whiteboard || this.ability.cannot("update", whiteboard);
  });

  /** the records of the entity cards, by prefixed id (missing ones are simply absent) */
  readonly loadedEntities = signal(new Map<string, Entity>());

  readonly connections = computed<WhiteboardConnection[]>(() => {
    const manual = this.items()
      .filter(isConnectionItem)
      .map((c) => ({ ...c, isReference: false }));
    const references = this.showReferences()
      ? getReferenceConnections(this.items(), this.loadedEntities())
      : [];
    return [...manual, ...references];
  });

  private readonly entityIdsOnBoard = computed(
    () => {
      const ids = this.items()
        .filter((item): item is WhiteboardEntityItem => item.type === "entity")
        .map((item) => item.entityId);
      return Array.from(new Set(ids)).sort();
    },
    { equal: (a, b) => a.join() === b.join() },
  );

  private saveTimeout: ReturnType<typeof setTimeout> | undefined;
  private hasUnsavedChanges = false;

  constructor() {
    super();

    // take over the items whenever a (new) entity is loaded, unless own edits are still unsaved
    effect(() => {
      const whiteboard = this.whiteboard();
      untracked(() => {
        if (!this.hasUnsavedChanges) {
          this.items.set(whiteboard?.items ?? []);
        }
        // open each board with all of its items in view
        const id = whiteboard?.getId();
        if (id && !whiteboard.isNew && id !== this.fittedBoardId) {
          this.fittedBoardId = id;
          afterNextRender(() => this.canvas().fitToContent(), {
            injector: this.injector,
          });
        }
      });
    });

    // load the records shown on the board and keep them updated
    effect((onCleanup) => {
      const ids = this.entityIdsOnBoard();
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      untracked(() => void this.loadEntities(ids, () => cancelled));

      const types = Array.from(
        new Set(ids.map((id) => Entity.extractTypeFromId(id))),
      ).filter((type) => this.entities.has(type));
      const subscription = merge(
        ...types.map((type) => this.entityMapperService.receiveUpdates(type)),
      ).subscribe(({ entity, type }) => {
        if (!ids.includes(entity.getId())) {
          return;
        }
        this.loadedEntities.update((loaded) => {
          const next = new Map(loaded);
          if (type === "remove") {
            next.delete(entity.getId());
          } else {
            next.set(entity.getId(), entity);
          }
          return next;
        });
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // a board opened through "Add New" only needs a title before it can be used
    effect(() => {
      const whiteboard = this.whiteboard();
      if (!whiteboard?.isNew) {
        this.creatingNewBoard = false;
      } else if (!this.creatingNewBoard) {
        this.creatingNewBoard = true;
        untracked(() => void this.createNewBoard(whiteboard));
      }
    });

    this.destroyRef.onDestroy(() => {
      this.unsavedChanges.setUnsavedChanges(this, false);
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        void this.save();
      }
    });
  }

  private creatingNewBoard = false;
  private fittedBoardId: string | undefined;

  private async createNewBoard(whiteboard: Whiteboard) {
    const result = await firstValueFrom(
      this.dialog
        .open<
          WhiteboardTextDialogComponent,
          WhiteboardTextDialogData,
          WhiteboardTextDialogResult
        >(WhiteboardTextDialogComponent, {
          data: { title: $localize`New whiteboard` },
          width: "400px",
        })
        .afterClosed(),
    );
    if (this.destroyRef.destroyed) {
      return;
    }
    if (!result || result === "remove" || !result.text) {
      await this.router.navigate([getEntityRuntimeRoute(Whiteboard)]);
      return;
    }
    whiteboard.title = result.text;
    await this.entityMapperService.save(whiteboard);
    await this.router.navigate(
      [getEntityRuntimeRoute(Whiteboard), whiteboard.getId(true)],
      { replaceUrl: true },
    );
  }

  private async loadEntities(ids: string[], isCancelled: () => boolean) {
    const loaded = new Map<string, Entity>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          loaded.set(
            id,
            await this.entityMapperService.load(
              Entity.extractTypeFromId(id),
              id,
            ),
          );
        } catch (e) {
          // the record may have been deleted or is not accessible: the card shows a placeholder
          Logging.debug("[WHITEBOARD] could not load record", id, e);
        }
      }),
    );
    if (!isCancelled()) {
      this.loadedEntities.set(loaded);
    }
  }

  /**
   * Apply a change to the board's items and schedule saving it.
   *
   * A pending save is deliberately not registered as an unsaved change: it is flushed when the view
   * is left, so there is nothing to discard. Only a failed save is registered (see `save()`).
   */
  updateItems(update: (items: WhiteboardItem[]) => WhiteboardItem[]) {
    this.items.update(update);
    this.hasUnsavedChanges = true;
    this.saveState.set("pending");

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = undefined;
      void this.save();
    }, WHITEBOARD_SAVE_DEBOUNCE_MS);
  }

  private async save() {
    const whiteboard = this.whiteboard();
    if (!whiteboard || !this.hasUnsavedChanges) {
      return;
    }
    const items = this.items();
    this.saveState.set("saving");
    try {
      whiteboard.items = items;
      await this.entityMapperService.save(whiteboard);
      if (this.items() === items) {
        // no further change happened while saving
        this.hasUnsavedChanges = false;
        this.saveState.set("saved");
        this.unsavedChanges.setUnsavedChanges(this, false);
      }
    } catch (e) {
      this.saveState.set("error");
      if (!this.destroyRef.destroyed) {
        // the changes exist only in this view: warn before they are lost by navigating away
        this.unsavedChanges.setUnsavedChanges(this, true);
      }
      Logging.warn("[WHITEBOARD] saving failed", e);
    }
  }

  onItemChange(changed: WhiteboardItem) {
    this.updateItems((items) =>
      items.map((item) => (item.id === changed.id ? changed : item)),
    );
  }

  /** remove an item together with the connections attached to it */
  onItemRemove(removed: WhiteboardItem) {
    this.updateItems((items) =>
      items.filter(
        (item) =>
          item.id !== removed.id &&
          !(
            isConnectionItem(item) &&
            (item.fromItemId === removed.id || item.toItemId === removed.id)
          ),
      ),
    );
  }

  onConnectionCreate(connection: { fromItemId: string; toItemId: string }) {
    const exists = this.items().some(
      (item) =>
        isConnectionItem(item) &&
        ((item.fromItemId === connection.fromItemId &&
          item.toItemId === connection.toItemId) ||
          (item.fromItemId === connection.toItemId &&
            item.toItemId === connection.fromItemId)),
    );
    if (exists) {
      return;
    }
    this.updateItems((items) => [
      ...items,
      createWhiteboardItem.connection(
        connection.fromItemId,
        connection.toItemId,
      ),
    ]);
  }

  async onItemEdit(item: WhiteboardItem) {
    const data = this.getTextDialogData(item);
    if (!data) {
      return;
    }
    const result = await firstValueFrom(
      this.dialog
        .open<
          WhiteboardTextDialogComponent,
          WhiteboardTextDialogData,
          WhiteboardTextDialogResult
        >(WhiteboardTextDialogComponent, { data, width: "400px" })
        .afterClosed(),
    );
    if (result === "remove") {
      this.onItemRemove(item);
    } else if (result) {
      const key =
        item.type === "group" || item.type === "connection" ? "label" : "text";
      this.onItemChange({ ...item, [key]: result.text });
    }
  }

  private getTextDialogData(
    item: WhiteboardItem,
  ): WhiteboardTextDialogData | undefined {
    switch (item.type) {
      case "note":
        return {
          title: $localize`Edit note`,
          text: item.text,
          multiline: true,
        };
      case "text":
        return { title: $localize`Edit text`, text: item.text };
      case "group":
        return {
          title: $localize`Edit group title`,
          text: item.label,
        };
      case "connection":
        return {
          title: $localize`Edit connection label`,
          text: item.label,
          allowRemove: true,
        };
      default:
        return undefined;
    }
  }

  async addRecords() {
    const ids = await firstValueFrom(
      this.dialog
        .open<AddWhiteboardEntityDialogComponent, undefined, string[]>(
          AddWhiteboardEntityDialogComponent,
          { width: "500px" },
        )
        .afterClosed(),
    );
    if (ids?.length) {
      this.addEntityCards(ids, this.canvas().getViewportCenter());
    }
  }

  addNote() {
    this.addItem(
      createWhiteboardItem.note(this.getFreePosition(DEFAULT_NOTE_SIZE)),
    );
  }

  async addText() {
    const item = createWhiteboardItem.text(
      this.getFreePosition({ width: 200, height: 40 }),
      $localize`Text`,
    );
    this.addItem(item);
    await this.onItemEdit(item);
  }

  async addGroup() {
    const item = createWhiteboardItem.group(this.getFreePosition(CARD_SIZE));
    this.addItem(item);
    await this.onItemEdit(item);
  }

  /**
   * Add cards for all records linked to the given card (through its own `entity` fields
   * as well as records referencing it) that are not on the board yet, arranged around the card.
   */
  async addLinkedRecords(card: WhiteboardEntityItem) {
    const entity = this.loadedEntities().get(card.entityId);
    if (!entity) {
      return;
    }
    const outgoing = Array.from(entity.getSchema().entries())
      .filter(([, field]) => field.dataType === EntityDatatype.dataType)
      .flatMap(([fieldId]) => asArray(entity[fieldId] ?? []) as string[]);
    const incoming = (
      await this.entityRelations.loadAllLinkingToEntity(entity)
    ).map((linked) => linked.entity.getId());
    if (this.destroyRef.destroyed) {
      return;
    }

    const onBoard = new Set(this.entityIdsOnBoard());
    const toAdd = Array.from(new Set([...outgoing, ...incoming])).filter(
      (id) => !onBoard.has(id),
    );
    if (toAdd.length === 0) {
      return;
    }
    const positions = getPositionsAround(
      { x: card.x + CARD_SIZE.width / 2, y: card.y + CARD_SIZE.height / 2 },
      toAdd.length,
      Math.max(220, 50 * toAdd.length),
    );
    this.updateItems((items) => [
      ...items,
      ...toAdd.map((id, i) =>
        createWhiteboardItem.entity(id, {
          x: positions[i].x - CARD_SIZE.width / 2,
          y: positions[i].y - CARD_SIZE.height / 2,
        }),
      ),
    ]);
  }

  private addEntityCards(entityIds: string[], around: Point) {
    const newItems: WhiteboardEntityItem[] = [];
    const occupied = this.canvas().getItemRects();
    for (const id of entityIds) {
      const position = findFreePosition(
        {
          x: around.x - CARD_SIZE.width / 2,
          y: around.y - CARD_SIZE.height / 2,
        },
        CARD_SIZE,
        occupied,
      );
      occupied.push({ ...position, ...CARD_SIZE });
      newItems.push(createWhiteboardItem.entity(id, position));
    }
    this.updateItems((items) => [...items, ...newItems]);
  }

  private addItem(item: WhiteboardItem) {
    this.updateItems((items) => [...items, item]);
  }

  private getFreePosition(size: { width: number; height: number }): Point {
    const center = this.canvas().getViewportCenter();
    return findFreePosition(
      { x: center.x - size.width / 2, y: center.y - size.height / 2 },
      size,
      this.canvas().getItemRects(),
    );
  }
}
