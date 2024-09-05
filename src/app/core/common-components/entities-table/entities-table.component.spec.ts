import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";

import { EntitiesTableComponent } from "./entities-table.component";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { Note } from "../../../child-dev-project/notes/model/note";
import moment from "moment/moment";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
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
import { Router } from "@angular/router";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntitiesTableComponent", () => {
  let component: EntitiesTableComponent<Entity>;
  let fixture: ComponentFixture<EntitiesTableComponent<Entity>>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj(["extendFormFieldConfig"]);
    mockFormService.extendFormFieldConfig.and.callFake((c) =>
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
          useValue: jasmine.createSpyObj(["openFormPopup"]),
        },
        { provide: CurrentUserSubject, useValue: of(null) },
        { provide: EntityMapperService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitiesTableComponent);
    component = fixture.componentInstance;
    component.editable = false;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should sort enums by the label", () => {
    class Test extends Entity {
      public enumValue: ConfigurableEnumValue;

      constructor(label: string, id: string) {
        super();
        this.enumValue = { label: label, id: id };
      }
    }

    const first = new Test("aaa", "first");
    const second = new Test("aab", "second");
    const third = new Test("c", "third");
    component.records = [second, first, third];
    component.customColumns = [
      {
        id: "enumValue",
        label: "Test Configurable Enum",
        viewComponent: "DisplayConfigurableEnum",
      },
    ];
    fixture.detectChanges();

    component.recordsDataSource.sort.direction = "";
    component.recordsDataSource.sort.sort({
      id: "enumValue",
      start: "asc",
      disableClear: false,
    });

    const sortedData = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((row) => row.record);
    expect(sortedData).toEqual([first, second, third]);
  });

  it("should apply default sort on first column and order dates descending", () => {
    component.entityType = Note;
    component.customColumns = [
      { id: "date", dataType: DateDatatype.dataType },
      "subject",
    ];
    component.columnsToDisplay = ["date", "subject"];

    const oldNote = Note.create(moment().subtract(1, "day").toDate());
    const newNote = Note.create(new Date());
    component.records = [oldNote, newNote];
    fixture.detectChanges();

    expect(component.recordsDataSource.sort.direction).toBe("desc");
    expect(component.recordsDataSource.sort.active).toBe("date");
  });

  it("should use input defaultSort if defined", () => {
    component.customColumns = ["date", "subject"];
    component.columnsToDisplay = ["date", "subject"];
    const n1 = Note.create(new Date(), "1");
    const n2 = Note.create(new Date(), "2");
    const n3 = Note.create(new Date(), "3");

    component.records = [n3, n1, n2];

    component.sortBy = { active: "subject", direction: "asc" };
    fixture.detectChanges();

    expect(component.recordsDataSource.sort.direction).toBe("asc");
    expect(component.recordsDataSource.sort.active).toBe("subject");
  });

  it("should sort standard objects", () => {
    const children = [
      new TestEntity("0"),
      new TestEntity("1"),
      new TestEntity("2"),
      new TestEntity("3"),
    ];
    children[0].name = "AA";
    children[3].name = "AB";
    children[2].name = "Z";
    children[1].name = "C";
    component.records = children;

    component.sortBy = { active: "name", direction: "asc" };
    fixture.detectChanges();

    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((c) => c.record.getId(true));
    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort non-standard objects", () => {
    const notes = [new Note("0"), new Note("1"), new Note("2"), new Note("3")];
    notes[0].category = { id: "0", label: "AA", _ordinal: 3 };
    notes[1].category = { id: "3", label: "C", _ordinal: 1 };
    notes[2].category = { id: "2", label: "Z", _ordinal: 0 };
    notes[3].category = { id: "1", label: "AB", _ordinal: 2 };
    component.records = notes;

    component.sortBy = { active: "category", direction: "asc" };
    fixture.detectChanges();

    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((note) => note.record.getId(true));
    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort strings ignoring case", () => {
    const names = ["C", "A", "b"];
    component.records = names.map((name) => TestEntity.create(name));

    component.sortBy = { active: "name", direction: "asc" };
    fixture.detectChanges();

    const sortedNames = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((row) => row.record["name"]);

    expect(sortedNames).toEqual(["A", "b", "C"]);
  });

  it("should notify when an entity is clicked", (done) => {
    const child = new TestEntity();
    component.entityClick.subscribe((entity) => {
      expect(entity).toEqual(child);
      done();
    });

    component.onRowClick({ record: child });
  });

  it("should filter data based on filter definition", () => {
    const c1 = TestEntity.create("Matching");
    c1.dateOfBirth = new DateWithAge(moment().subtract(1, "years").toDate());
    const c2 = TestEntity.create("Not Matching");
    c2.dateOfBirth = new DateWithAge(moment().subtract(2, "years").toDate());
    const c3 = TestEntity.create("Matching");
    c3.dateOfBirth = new DateWithAge(moment().subtract(3, "years").toDate());
    // get type-safety for filters
    const childComponent =
      component as any as EntitiesTableComponent<TestEntity>;
    childComponent.records = [c1, c2, c3];

    childComponent.filter = { name: "Matching" };

    expect(childComponent.recordsDataSource.data).toEqual([
      { record: c1 },
      { record: c3 },
    ]);

    childComponent.filter = {
      name: "Matching",
      "dateOfBirth.age": { $gte: 2 },
    } as any;

    expect(childComponent.recordsDataSource.data).toEqual([{ record: c3 }]);

    const c4 = TestEntity.create("Matching");
    c4.dateOfBirth = new DateWithAge(moment().subtract(4, "years").toDate());
    const c5 = TestEntity.create("Not Matching");

    childComponent.records = [c1, c2, c3, c4, c5];

    expect(childComponent.recordsDataSource.data).toEqual([
      { record: c3 },
      { record: c4 },
    ]);
  });

  it("should remove an entity if it does not pass the filter anymore", fakeAsync(() => {
    const child = new TestEntity();
    child.category = genders[1];
    component.records = [child];
    component.filter = { "category.id": genders[1].id } as any;

    expect(component.recordsDataSource.data).toEqual([{ record: child }]);

    child.category = genders[2];
    component.records = [child]; // parent component has to update the records Input array

    expect(component.recordsDataSource.data).toEqual([]);
  }));

  it("should only show active relations by default", async () => {
    const active1 = new Entity();
    active1.inactive = false;
    const inactive = new Entity();
    inactive.inactive = true;

    component.records = [active1, inactive];

    expect(component.recordsDataSource.data).toEqual([{ record: active1 }]);
  });

  it("should overwrite entity schema fields with customColumn config", async () => {
    component.entityType = TestEntity;
    const customField = {
      id: "name",
      label: "Custom Name Label",
    };
    component.customColumns = [customField];

    expect(component._columns.find((c) => c.id === customField.id).label).toBe(
      customField.label,
    );
  });

  it("should set noSorting if dataType cannot be sorted properly", () => {
    component.entityType = Note;

    expect(
      component._columns.find((c) => c.id === "children").noSorting,
    ).toBeTrue();
  });

  it("should navigate to '/new' route on newly created entities", () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    component.clickMode = "navigate";

    const child = new TestEntity();
    expect(child.isNew).toBeTrue();
    component.showEntity(child);
    expect(navigateSpy).toHaveBeenCalledWith([TestEntity.route, "new"]);

    child._rev = "1-existing";
    expect(child.isNew).toBeFalse();
    component.showEntity(child);
    expect(navigateSpy).toHaveBeenCalledWith([
      TestEntity.route,
      child.getId(true),
    ]);
  });
});
