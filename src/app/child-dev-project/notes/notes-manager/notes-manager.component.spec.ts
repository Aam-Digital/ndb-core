import {
  NotesManagerComponent,
  NotesManagerConfig,
} from "./notes-manager.component";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of, Subject } from "rxjs";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import {
  ConfigurableEnumFilterConfig,
  EntityListConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { InteractionType } from "../model/interaction-type.interface";
import { EventNote } from "../../attendance/model/event-note";
import { UpdatedEntity } from "../../../core/entity/model/entity-update";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Ordering } from "../../../core/configurable-enum/configurable-enum-ordering";

describe("NotesManagerComponent", () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;

  let entityMapper: EntityMapperService;
  let mockNoteObservable: Subject<UpdatedEntity<Note>>;
  let mockEventNoteObservable: Subject<UpdatedEntity<Note>>;
  const dialogMock: jasmine.SpyObj<FormDialogService> = jasmine.createSpyObj(
    "dialogMock",
    ["openSimpleForm"]
  );

  const routeData: EntityListConfig = {
    title: "Notes List",
    columns: [],
    columnGroups: {
      default: "Standard",
      mobile: "Standard",
      groups: [
        {
          name: "Standard",
          columns: ["date", "subject", "children"],
        },
      ],
    },
    filters: [
      {
        id: "status",
        type: "prebuilt",
      },
      {
        id: "date",
        type: "prebuilt",
      },
      {
        id: "category",
        type: "configurable-enum",
        enumId: "interaction-type",
      } as ConfigurableEnumFilterConfig<Note>,
    ],
  };

  const routeMock = {
    data: new BehaviorSubject({ config: routeData }),
    queryParams: of({}),
    snapshot: { queryParams: {} },
  };

  const testInteractionTypes: InteractionType[] = Ordering.imposeTotalOrdering([
    {
      id: "HOME_VISIT",
      label: "Home Visit",
    },
    {
      id: "GUARDIAN_TALK",
      label: "Talk with Guardians",
    },
  ]);

  beforeEach(() => {
    mockNoteObservable = new Subject<UpdatedEntity<Note>>();
    mockEventNoteObservable = new Subject<UpdatedEntity<EventNote>>();

    TestBed.configureTestingModule({
      imports: [NotesManagerComponent, MockedTestingModule.withState()],
      providers: [
        { provide: FormDialogService, useValue: dialogMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.callFake((entityType) =>
      (entityType as any) === Note
        ? (mockNoteObservable as any)
        : (mockEventNoteObservable as any)
    );
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesManagerComponent);
    component = fixture.componentInstance;
    const router = fixture.debugElement.injector.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set up prebuilt filters", fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.config.filters.length).toEqual(3);
    expect(component.config.filters[0]).toHaveOwnProperty("options");
    expect(component.config.filters[1]).toHaveOwnProperty("options");
    expect(component.config.filters[2]).not.toHaveOwnProperty("options");
  }));

  it("should open the dialog when clicking details", () => {
    const note = new Note("testNote");
    component.showDetails(note);
    expect(dialogMock.openSimpleForm).toHaveBeenCalledWith(
      note,
      undefined,
      NoteDetailsComponent
    );
  });

  it("should open dialog when add note is clicked", fakeAsync(() => {
    const newNote = new Note("new");
    const returnValue: any = { afterClosed: () => of(newNote) };
    dialogMock.openSimpleForm.and.returnValue(returnValue);
    component.addNoteClick();
  }));

  it("will contain a new note when saved by an external component", () => {
    const newNote = new Note("new");
    const oldLength = component.notes.length;
    mockNoteObservable.next({ entity: newNote, type: "new" });
    expect(component.notes).toHaveSize(oldLength + 1);
  });

  it("will contain the updated note when updated", async () => {
    const note = new Note("n1");
    note.authors = ["A"];
    mockNoteObservable.next({ entity: note, type: "new" });
    expect(component.notes).toHaveSize(1);
    expect(component.notes[0].authors).toEqual(["A"]);
    note.authors = ["B"];
    mockNoteObservable.next({ entity: note, type: "update" });
    expect(component.notes).toHaveSize(1);
    expect(component.notes[0].authors).toEqual(["B"]);
  });

  it("displays Notes and Event notes only when toggle is set to true", async () => {
    component.includeEventNotes = false;
    const note = Note.create(new Date("2020-01-01"), "test note");
    note.category = testInteractionTypes[0];
    const eventNote = EventNote.create(new Date("2020-01-01"), "test event");
    eventNote.category = testInteractionTypes[0];
    await entityMapper.save(note);
    await entityMapper.save(eventNote);

    await component.updateIncludeEvents();

    expect(component.notes).toEqual([note, eventNote]);

    await component.updateIncludeEvents();

    expect(component.notes).toEqual([note]);
  });

  it("loads initial list including EventNotes if set in config", fakeAsync(() => {
    component.isLoading = true;
    const note = Note.create(new Date("2020-01-01"), "test note");
    note.category = testInteractionTypes[0];
    const eventNote = EventNote.create(new Date("2020-01-01"), "test event");
    eventNote.category = testInteractionTypes[0];
    entityMapper.save(note);
    entityMapper.save(eventNote);
    tick();

    routeMock.data.next({
      config: Object.assign(
        { includeEventNotes: true } as NotesManagerConfig,
        routeData
      ),
    });

    flush();

    expect(component.notes).toEqual([note, eventNote]);
    expect(component.isLoading).toBeFalse();
  }));
});
