import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitiesTableComponent } from "./entities-table.component";
import { Entity } from "../../entity/model/entity";

import { Note } from "../../../child-dev-project/notes/model/note";
import moment from "moment/moment";
import { genders } from "../../../child-dev-project/children/model/genders";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { EntityFormService } from "../entity-form/entity-form.service";
import { toFormFieldConfig } from "../entity-form/FormConfig";
import { FilterService } from "../../filter/filter.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { of } from "rxjs";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { Router, ActivatedRoute } from "@angular/router";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntitiesTableComponent", () => {
  let component: EntitiesTableComponent<Entity>;
  let fixture: ComponentFixture<EntitiesTableComponent<Entity>>;

  let mockFormService: any;

  beforeEach(async () => {
    mockFormService = {
      extendFormFieldConfig: vi.fn(),
    };
    mockFormService.extendFormFieldConfig.mockImplementation((c) =>
      toFormFieldConfig(c),
    );

    await TestBed.configureTestingModule({
      imports: [
        EntitiesTableComponent,
        CoreTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        FilterService,
        {
          provide: FormDialogService,
          useValue: {
            openFormPopup: vi.fn(),
          },
        },
        { provide: CurrentUserSubject, useValue: of(null) },
        {
          provide: Router,
          useValue: (() => {
            const spy = {
              navigate: vi.fn(),
              createUrlTree: vi.fn(),
            };
            spy.createUrlTree.mockReturnValue({ toString: () => "/?foo=bar" });
            return spy;
          })(),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitiesTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("editable", false);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should apply default sort on first column and order dates descending", () => {
    fixture.componentRef.setInput("entityType", Note);
    fixture.componentRef.setInput("customColumns", [
      { id: "date", dataType: DateDatatype.dataType },
      "subject",
    ]);
    fixture.componentRef.setInput("columnsToDisplay", ["date", "subject"]);

    const oldNote = Note.create(moment().subtract(1, "day").toDate());
    const newNote = Note.create(new Date());
    fixture.componentRef.setInput("records", [oldNote, newNote]);
    fixture.detectChanges();

    expect(component.recordsDataSource.sort.direction).toBe("desc");
    expect(component.recordsDataSource.sort.active).toBe("date");
  });

  it("should use input defaultSort if defined", () => {
    fixture.componentRef.setInput("customColumns", ["date", "subject"]);
    fixture.componentRef.setInput("columnsToDisplay", ["date", "subject"]);
    const n1 = Note.create(new Date(), "1");
    const n2 = Note.create(new Date(), "2");
    const n3 = Note.create(new Date(), "3");

    fixture.componentRef.setInput("records", [n3, n1, n2]);
    fixture.componentRef.setInput("sortBy", {
      active: "subject",
      direction: "asc",
    });
    fixture.detectChanges();

    expect(component.recordsDataSource.sort.direction).toBe("asc");
    expect(component.recordsDataSource.sort.active).toBe("subject");
  });

  it("should skip non-sortable columns when inferring default sort", () => {
    fixture.componentRef.setInput("entityType", Note);
    fixture.componentRef.setInput("columnsToDisplay", ["children", "subject"]);

    const n1 = Note.create(new Date(), "B");
    const n2 = Note.create(new Date(), "A");
    fixture.componentRef.setInput("records", [n1, n2]);
    fixture.detectChanges();

    expect(component.recordsDataSource.sort.active).toBe("subject");
    expect(component.recordsDataSource.sort.direction).toBe("asc");
  });

  it("should sort non-standard objects", () => {
    const notes = [
      new Note("note-0"),
      new Note("note-1"),
      new Note("note-2"),
      new Note("note-3"),
    ];
    notes[0].category = { id: "0", label: "AA", _ordinal: 3 };
    notes[1].category = { id: "3", label: "C", _ordinal: 1 };
    notes[2].category = { id: "2", label: "Z", _ordinal: 0 };
    notes[3].category = { id: "1", label: "AB", _ordinal: 2 };
    fixture.componentRef.setInput("entityType", Note);
    fixture.componentRef.setInput("records", notes);
    fixture.componentRef.setInput("sortBy", {
      active: "category",
      direction: "asc",
    });
    fixture.detectChanges();

    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((note) => note.record.getId(true));
    expect(sortedIds).toEqual(["note-2", "note-1", "note-3", "note-0"]);
  });

  it("should sort virtual age columns using their configured source field", () => {
    const youngest = TestEntity.create("youngest");
    youngest.dateOfBirth = new DateWithAge(
      moment().subtract(5, "years").toDate(),
    );
    const oldest = TestEntity.create("oldest");
    oldest.dateOfBirth = new DateWithAge(
      moment().subtract(15, "years").toDate(),
    );

    fixture.componentRef.setInput("customColumns", [
      {
        id: "years",
        viewComponent: "DisplayAge",
        additional: "dateOfBirth",
      },
    ]);
    fixture.componentRef.setInput("columnsToDisplay", ["years"]);
    fixture.componentRef.setInput("records", [oldest, youngest]);
    fixture.componentRef.setInput("sortBy", {
      active: "years",
      direction: "asc",
    });
    fixture.detectChanges();

    const sortedNames = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((row) => row.record["name"]);
    expect(sortedNames).toEqual(["youngest", "oldest"]);
  });

  it("should notify when an entity is clicked", async () => {
    const child = new TestEntity();
    const mockEvent = new MouseEvent("click");
    component.entityClick.subscribe((entity) => {
      expect(entity).toEqual(child);
    });

    component.onRowClick({ record: child }, mockEvent);
  });

  it("should filter data based on filter definition", () => {
    const c1 = TestEntity.create("Matching");
    c1.dateOfBirth = new DateWithAge(moment().subtract(1, "years").toDate());
    const c2 = TestEntity.create("Not Matching");
    c2.dateOfBirth = new DateWithAge(moment().subtract(2, "years").toDate());
    const c3 = TestEntity.create("Matching");
    c3.dateOfBirth = new DateWithAge(moment().subtract(3, "years").toDate());

    fixture.componentRef.setInput("records", [c1, c2, c3]);
    fixture.componentRef.setInput("filter", { name: "Matching" });
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([
      { record: c1 },
      { record: c3 },
    ]);

    fixture.componentRef.setInput("filter", {
      name: "Matching",
      "dateOfBirth.age": { $gte: 2 },
    });
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([{ record: c3 }]);

    const c4 = TestEntity.create("Matching");
    c4.dateOfBirth = new DateWithAge(moment().subtract(4, "years").toDate());
    const c5 = TestEntity.create("Not Matching");

    fixture.componentRef.setInput("records", [c1, c2, c3, c4, c5]);
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([
      { record: c3 },
      { record: c4 },
    ]);
  });

  it("should remove an entity if it does not pass the filter anymore", async () => {
    const child = new TestEntity();
    child.category = genders[1];
    fixture.componentRef.setInput("records", [child]);
    fixture.componentRef.setInput("filter", {
      "category.id": genders[1].id,
    } as any);
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([{ record: child }]);

    child.category = genders[2];
    fixture.componentRef.setInput("records", [child]); // parent component has to update the records Input array
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([]);
  });

  it("should only show active relations by default", async () => {
    const active1 = new Entity();
    active1.inactive = false;
    const inactive = new Entity();
    inactive.inactive = true;

    fixture.componentRef.setInput("records", [active1, inactive]);
    fixture.detectChanges();

    expect(component.recordsDataSource.data).toEqual([{ record: active1 }]);
  });

  it("should overwrite entity schema fields with customColumn config", async () => {
    fixture.componentRef.setInput("entityType", TestEntity);
    const customField = {
      id: "name",
      label: "Custom Name Label",
    };
    fixture.componentRef.setInput("customColumns", [customField]);
    fixture.detectChanges();

    expect(
      component._columns().find((c) => c.id === customField.id).label,
    ).toBe(customField.label);
  });

  it("should set noSorting if dataType cannot be sorted properly", () => {
    fixture.componentRef.setInput("entityType", Note);
    fixture.detectChanges();

    expect(
      component._columns().find((c) => c.id === "children").noSorting,
    ).toBe(true);
  });

  it("should navigate to '/new' route on newly created entities", () => {
    const navigateSpy = TestBed.inject(Router).navigate;
    fixture.componentRef.setInput("clickMode", "navigate");
    fixture.detectChanges();

    const child = new TestEntity();
    expect(child.isNew).toBe(true);
    component.showEntity(child);
    expect(navigateSpy).toHaveBeenCalledWith(["/c/test-entity", "new"]);

    child._rev = "1-existing";
    expect(child.isNew).toBe(false);
    component.showEntity(child);
    expect(navigateSpy).toHaveBeenCalledWith([
      "/c/test-entity",
      child.getId(true),
    ]);
  });
});
