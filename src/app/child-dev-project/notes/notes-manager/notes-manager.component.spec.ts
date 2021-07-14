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
import { NotesModule } from "../notes.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { RouterTestingModule } from "@angular/router/testing";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { User } from "../../../core/user/user";
import { Note } from "../model/note";
import { Angulartics2Module } from "angulartics2";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import {
  ConfigurableEnumFilterConfig,
  EntityListConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { InteractionType } from "../model/interaction-type.interface";
import { ConfigService } from "../../../core/config/config.service";
import { By } from "@angular/platform-browser";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { EventNote } from "app/child-dev-project/attendance/model/event-note";
import { BehaviorSubject } from "rxjs";
import { BackupService } from "../../../core/admin/services/backup.service";
import { UpdatedEntity } from "../../../core/entity/model/entity-update";

describe("NotesManagerComponent", () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockNoteObservable: Subject<UpdatedEntity<Note>>;
  let mockEventNoteObservable: Subject<UpdatedEntity<Note>>;
  const dialogMock: jasmine.SpyObj<FormDialogService> = jasmine.createSpyObj(
    "dialogMock",
    ["openDialog"]
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
    data: new BehaviorSubject(routeData),
    queryParams: of({}),
  };

  const testInteractionTypes: InteractionType[] = [
    {
      id: "HOME_VISIT",
      label: "Home Visit",
    },
    {
      id: "GUARDIAN_TALK",
      label: "Talk with Guardians",
    },
  ];

  beforeEach(() => {
    const mockConfigService = jasmine.createSpyObj("mockConfigService", [
      "getConfig",
    ]);
    mockConfigService.getConfig.and.returnValue(testInteractionTypes);

    mockEntityMapper = jasmine.createSpyObj([
      "loadType",
      "receiveUpdates",
      "save",
    ]);
    mockEntityMapper.loadType.and.resolveTo([]);
    mockNoteObservable = new Subject<UpdatedEntity<Note>>();
    mockEventNoteObservable = new Subject<UpdatedEntity<EventNote>>();
    mockEntityMapper.receiveUpdates.and.callFake((entityType) =>
      (entityType as any) === Note
        ? (mockNoteObservable as any)
        : (mockEventNoteObservable as any)
    );

    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [],
      imports: [NotesModule, RouterTestingModule, Angulartics2Module.forRoot()],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: FormDialogService, useValue: dialogMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: BackupService, useValue: {} },
      ],
    }).compileComponents();
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
    expect(component.config.filters[0].hasOwnProperty("options")).toBeTrue();
    expect(component.config.filters[1].hasOwnProperty("options")).toBeTrue();
    expect(component.config.filters[2].hasOwnProperty("options")).toBeFalse();
  }));

  it("should open the dialog when clicking details", () => {
    const note = new Note("testNote");
    component.showDetails(note);
    expect(dialogMock.openDialog).toHaveBeenCalledWith(
      NoteDetailsComponent,
      note
    );
  });

  it("should open dialog when add note is clicked", fakeAsync(() => {
    const newNote = new Note("new");
    const returnValue: any = { afterClosed: () => of(newNote) };
    dialogMock.openDialog.and.returnValue(returnValue);
    component.addNoteClick();
    expect(dialogMock.openDialog).toHaveBeenCalled();
  }));

  it("should set up category filter from configurable enum", fakeAsync(() => {
    component.notes = [
      Object.assign(new Note(), { category: testInteractionTypes[0] }),
    ];
    fixture.detectChanges();
    flush();

    const list = fixture.debugElement.query(By.css("app-entity-list"));
    const filterSettings = (
      list.componentInstance as EntityListComponent<Note>
    ).filterSelections.find((f) => f.filterSettings.name === "category");

    expect(filterSettings.filterSettings.options.length).toEqual(
      testInteractionTypes.length + 1
    );
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
    const note = Note.create(new Date("2020-01-01"), "test note");
    note.category = testInteractionTypes[0];
    const eventNote = EventNote.create(new Date("2020-01-01"), "test event");
    eventNote.category = testInteractionTypes[0];
    mockEntityMapper.loadType.and.callFake(loadTypeFake([note], [eventNote]));

    component.includeEventNotes = true;
    await component.updateIncludeEvents();

    expect(component.notes).toEqual([note, eventNote]);
    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(Note);
    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(EventNote);

    component.includeEventNotes = false;
    await component.updateIncludeEvents();

    expect(component.notes).toEqual([note]);
    expect(mockEntityMapper.loadType.calls.mostRecent().args).toEqual([Note]);
  });

  it("loads initial list including EventNotes if set in config", fakeAsync(async () => {
    const note = Note.create(new Date("2020-01-01"), "test note");
    note.category = testInteractionTypes[0];
    const eventNote = EventNote.create(new Date("2020-01-01"), "test event");
    eventNote.category = testInteractionTypes[0];
    mockEntityMapper.loadType.and.callFake(loadTypeFake([note], [eventNote]));

    routeMock.data.next(
      Object.assign(
        { includeEventNotes: true } as NotesManagerConfig,
        routeData
      )
    );

    flush();

    expect(component.notes).toEqual([note, eventNote]);
    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(Note);
    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(EventNote);
  }));
});

function loadTypeFake(notes: Note[], eventNotes: EventNote[]) {
  return (type) => {
    switch (type) {
      case Note:
        return Promise.resolve(notes);
      case EventNote:
        return Promise.resolve(eventNotes);
      default:
        return Promise.resolve([]);
    }
  };
}
