import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRelationsService } from "../../../core/entity/entity-mapper/entity-relations.service";
import { UnsavedChangesService } from "../../../core/entity-details/form/unsaved-changes.service";
import { EntityAbility } from "../../../core/permissions/ability/entity-ability";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import {
  mockMatDialog,
  mockMatDialogRef,
} from "../../../utils/test-utils/dialog-mocks";
import { Whiteboard } from "../model/whiteboard";
import {
  createWhiteboardItem,
  isConnectionItem,
} from "../model/whiteboard-item";
import {
  WHITEBOARD_SAVE_DEBOUNCE_MS,
  WhiteboardComponent,
} from "./whiteboard.component";

describe("WhiteboardComponent", () => {
  let component: WhiteboardComponent;
  let fixture: ComponentFixture<WhiteboardComponent>;
  let entityMapper: EntityMapperService;
  let loadAllLinkingToEntity: ReturnType<typeof vi.spyOn>;
  let dialog: ReturnType<typeof mockMatDialog>;

  const target = TestEntity.create({ name: "target" });
  const source = TestEntity.create({ name: "source", ref: target.getId() });
  let whiteboard: Whiteboard;
  let sourceCard: ReturnType<typeof createWhiteboardItem.entity>;
  let note: ReturnType<typeof createWhiteboardItem.note>;

  /** run change detection (which runs the component's effects) and let pending async work finish */
  async function settle() {
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sourceCard = createWhiteboardItem.entity(source.getId(), { x: 10, y: 10 });
    note = createWhiteboardItem.note({ x: 300, y: 10 });
    whiteboard = Whiteboard.create({
      title: "Test board",
      items: [
        sourceCard,
        note,
        createWhiteboardItem.connection(sourceCard.id, note.id, "see"),
      ],
    });
    whiteboard["_rev"] = "1"; // mark as "not new"

    await TestBed.configureTestingModule({
      imports: [
        WhiteboardComponent,
        MockedTestingModule.withState(undefined, [whiteboard, source, target]),
      ],
      providers: [{ provide: MatDialog, useValue: (dialog = mockMatDialog()) }],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);
    loadAllLinkingToEntity = vi
      .spyOn(TestBed.inject(EntityRelationsService), "loadAllLinkingToEntity")
      .mockResolvedValue([]);

    vi.useFakeTimers();
    fixture = TestBed.createComponent(WhiteboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityType", Whiteboard.ENTITY_TYPE);
    fixture.componentRef.setInput("id", whiteboard.getId(true));
    await settle();
    await settle();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the items of the loaded board and the records of its cards", async () => {
    expect(component.items()).toEqual(whiteboard.items);
    await settle();
    expect(component.loadedEntities().get(source.getId())?.toString()).toBe(
      "source",
    );
    expect(fixture.nativeElement.textContent).toContain("source");
  });

  it("saves a change after the debounce and reports the save state", async () => {
    const save = vi.spyOn(entityMapper, "save");

    component.onItemChange({ ...sourceCard, x: 500, y: 500 });
    expect(component.saveState()).toBe("pending");
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(WHITEBOARD_SAVE_DEBOUNCE_MS + 10);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Whiteboard;
    expect(saved.items.find((i) => i.id === sourceCard.id)).toEqual(
      expect.objectContaining({ x: 500, y: 500 }),
    );
    expect(component.saveState()).toBe("saved");
  });

  it("does not block navigation while a save is only pending, but does after a failed save", async () => {
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    const save = vi.spyOn(entityMapper, "save");

    // autosave flushes on leaving the view, so there is nothing to confirm for a pending save
    component.onItemChange({ ...sourceCard, x: 500, y: 500 });
    expect(unsavedChanges.pending()).toBe(false);

    save.mockRejectedValueOnce(new Error("offline"));
    await vi.advanceTimersByTimeAsync(WHITEBOARD_SAVE_DEBOUNCE_MS + 10);
    expect(component.saveState()).toBe("error");
    expect(unsavedChanges.pending()).toBe(true);

    // the next change is saved successfully and clears the warning
    component.onItemChange({ ...sourceCard, x: 600, y: 600 });
    await vi.advanceTimersByTimeAsync(WHITEBOARD_SAVE_DEBOUNCE_MS + 10);
    expect(component.saveState()).toBe("saved");
    expect(unsavedChanges.pending()).toBe(false);
  });

  it("saves a pending change when the view is left before the debounce ends", async () => {
    const save = vi.spyOn(entityMapper, "save");

    component.onItemChange({ ...sourceCard, x: 500, y: 500 });
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("clears the failed-save warning when the view is destroyed", async () => {
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    vi.spyOn(entityMapper, "save").mockRejectedValue(new Error("offline"));

    component.onItemChange({ ...sourceCard, x: 500, y: 500 });
    await vi.advanceTimersByTimeAsync(WHITEBOARD_SAVE_DEBOUNCE_MS + 10);
    expect(unsavedChanges.pending()).toBe(true);

    fixture.destroy();
    expect(unsavedChanges.pending()).toBe(false);
  });

  it("removes the connections attached to a removed item", () => {
    component.onItemRemove(note);

    expect(component.items()).toEqual([sourceCard]);
  });

  it("creates a manual connection only once per pair of items, regardless of direction", () => {
    component.onConnectionCreate({
      fromItemId: note.id,
      toItemId: sourceCard.id,
    });
    expect(component.items().filter(isConnectionItem)).toHaveLength(1);

    const text = createWhiteboardItem.text({ x: 0, y: 0 }, "label");
    component.updateItems((items) => [...items, text]);
    component.onConnectionCreate({ fromItemId: note.id, toItemId: text.id });
    expect(component.items().filter(isConnectionItem)).toHaveLength(2);
  });

  it("derives reference lines from the records on the board and lets the user hide them", async () => {
    const targetCard = createWhiteboardItem.entity(target.getId(), {
      x: 10,
      y: 300,
    });
    component.updateItems((items) => [...items, targetCard]);
    await settle();

    expect(component.connections()).toContainEqual(
      expect.objectContaining({
        fromItemId: sourceCard.id,
        toItemId: targetCard.id,
        isReference: true,
      }),
    );

    component.showReferences.set(false);
    expect(component.connections().filter((c) => c.isReference)).toEqual([]);
  });

  it("adds cards for the linked records that are not on the board yet", async () => {
    const linkingEntity = TestEntity.create({ name: "linking" });
    loadAllLinkingToEntity.mockResolvedValue([
      { entity: linkingEntity, fields: [] },
    ]);

    await component.addLinkedRecords(sourceCard);

    const entityIds = component
      .items()
      .filter((i) => i.type === "entity")
      .map((i) => i.entityId);
    expect(entityIds).toEqual([
      source.getId(),
      target.getId(),
      linkingEntity.getId(),
    ]);

    // adding again does not duplicate the cards
    await component.addLinkedRecords(sourceCard);
    expect(component.items().filter((i) => i.type === "entity")).toHaveLength(
      3,
    );
  });

  it("asks for a title when a new board is opened and saves it under its own url", async () => {
    dialog.open.mockReturnValue(mockMatDialogRef({ text: "My new board" }));
    const save = vi.spyOn(entityMapper, "save");
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    const newBoard = new Whiteboard();
    component.entity.set(newBoard);
    await settle();

    expect(save).toHaveBeenCalledWith(newBoard);
    expect(newBoard.title).toBe("My new board");
    expect(navigate).toHaveBeenCalledWith(
      [expect.any(String), newBoard.getId(true)],
      { replaceUrl: true },
    );
  });

  it("is read-only when the user may not update the board", async () => {
    vi.spyOn(TestBed.inject(EntityAbility), "cannot").mockReturnValue(true);
    component.entity.set(Whiteboard.create({ title: "other" }));
    await settle();

    expect(component.readonly()).toBe(true);
    expect(
      fixture.nativeElement.querySelector("button[aria-label='Item actions']"),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain("Add records");
  });
});
