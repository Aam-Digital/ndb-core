import { NotesManagerComponent } from "./notes-manager.component";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { RouterTestingModule } from "@angular/router/testing";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { User } from "../../../core/user/user";
import { Note } from "../model/note";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
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

describe("NotesManagerComponent", () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;
  const dialogMock: jasmine.SpyObj<FormDialogService> = jasmine.createSpyObj(
    "dialogMock",
    ["openDialog"]
  );

  const routeData: EntityListConfig = {
    title: "Notes List",
    columns: [
      { component: "DisplayDate", title: "Date", id: "date" },
      { component: "DisplayText", title: "Subject", id: "subject" },
      { component: "ChildBlockList", title: "Children", id: "children" },
    ],
    columnGroup: {
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
    data: of(routeData),
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

    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [],
      imports: [NotesModule, RouterTestingModule, Angulartics2Module.forRoot()],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: Database, useClass: MockDatabase },
        { provide: FormDialogService, useValue: dialogMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesManagerComponent);
    component = fixture.componentInstance;
    const router = fixture.debugElement.injector.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
    fixture.detectChanges();
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

  it("should set the color for the notes", fakeAsync(() => {
    const note1 = new Note("n1");
    note1.warningLevel = WarningLevel.URGENT;
    const note2 = new Note("n2");
    const note3 = new Note("n3");
    note3.category = { id: "TEST", label: "test", color: "CategoryColor" };
    const note4 = new Note("n4");
    note4.warningLevel = WarningLevel.WARNING;
    const entityMapper = fixture.debugElement.injector.get(EntityMapperService);
    spyOn(entityMapper, "loadType").and.returnValue(
      Promise.resolve([note1, note2, note3, note4])
    );
    component.ngOnInit();
    tick();
    expect(component.notes.length).toEqual(4);
    expect(component.notes[0]["color"]).toEqual(
      WarningLevelColor(note1.warningLevel)
    );
    expect(component.notes[1]["color"]).toEqual("");
    expect(component.notes[2]["color"]).toEqual("CategoryColor");
    expect(component.notes[3]["color"]).toEqual(
      WarningLevelColor(note4.warningLevel)
    );
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
    const lengthBefore = component.notes.length;
    const newNote = new Note("new");
    const returnValue: any = { afterClosed: () => of(newNote) };
    dialogMock.openDialog.and.returnValue(returnValue);
    component.addNoteClick();
    expect(dialogMock.openDialog).toHaveBeenCalled();
    tick();
    expect(component.notes.length).toBe(lengthBefore + 1);
    expect(component.notes.indexOf(newNote)).toBeGreaterThanOrEqual(0);
  }));

  it("should set up category filter from configurable enum", fakeAsync(() => {
    component.notes = [
      Object.assign(new Note(), { category: testInteractionTypes[0] }),
    ];
    fixture.detectChanges();
    flush();

    const list = fixture.debugElement.query(By.css("app-entity-list"));
    const filterSettings = (list.componentInstance as EntityListComponent<
      Note
    >).filterSelections.find((f) => f.filterSettings.name === "category");

    expect(filterSettings.filterSettings.options.length).toEqual(
      testInteractionTypes.length + 1
    );
  }));
});
