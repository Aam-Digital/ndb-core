import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import {
  EntitySubrecordComponent,
  TableRow,
} from "./entity-subrecord.component";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { AlertService } from "../../../alerts/alert.service";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { LoggingService } from "../../../logging/logging.service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import moment from "moment";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../../entity/model/entity-update";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ScreenWidthObserver } from "../../../../utils/media/screen-size-observer.service";
import { WINDOW_TOKEN } from "../../../../utils/di-tokens";
import { MediaModule } from "../../../../utils/media/media.module";
import { DateWithAge } from "../../../../child-dev-project/children/model/dateWithAge";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent<Entity>;
  let fixture: ComponentFixture<EntitySubrecordComponent<Entity>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        EntitySubrecordModule,
        MockedTestingModule.withState(),
        FontAwesomeTestingModule,
        MediaModule,
      ],
      providers: [
        { provide: WINDOW_TOKEN, useValue: window },
        {
          provide: FormDialogService,
          useValue: jasmine.createSpyObj(["openSimpleForm"]),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
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
    component.columns = [
      {
        id: "enumValue",
        label: "Test Configurable Enum",
        view: "DisplayConfigurableEnum",
      },
    ];
    component.ngOnChanges({ records: undefined, columns: undefined });
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
    component.columns = ["date", "subject"];
    component.columnsToDisplay = ["date", "subject"];
    component.records = [];
    // Trigger a change with empty columns first as this is what some components do that init data asynchronously
    component.ngOnChanges({ columns: undefined, records: undefined });

    const oldNote = Note.create(moment().subtract(1, "day").toDate());
    const newNote = Note.create(new Date());
    component.records = [oldNote, newNote];
    component.ngOnChanges({ records: undefined });

    expect(component.recordsDataSource.sort.direction).toBe("desc");
    expect(component.recordsDataSource.sort.active).toBe("date");
  });

  it("should use input defaultSort if defined", () => {
    component.columns = ["date", "subject"];
    component.columnsToDisplay = ["date", "subject"];
    const n1 = Note.create(new Date(), "1");
    const n2 = Note.create(new Date(), "2");
    const n3 = Note.create(new Date(), "3");

    component.records = [n3, n1, n2];

    component.defaultSort = { active: "subject", direction: "asc" };
    component.ngOnChanges({ columns: undefined, records: undefined });

    expect(component.recordsDataSource.sort.direction).toBe("asc");
    expect(component.recordsDataSource.sort.active).toBe("subject");
  });

  it("should sort standard objects", () => {
    const children = [
      new Child("0"),
      new Child("1"),
      new Child("2"),
      new Child("3"),
    ];
    children[0].name = "AA";
    children[3].name = "AB";
    children[2].name = "Z";
    children[1].name = "C";
    component.records = children;
    component.ngOnChanges({ records: undefined });

    component.sort.sort({ id: "name", start: "asc", disableClear: false });
    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((c) => c.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort non-standard objects", () => {
    const notes = [new Note("0"), new Note("1"), new Note("2"), new Note("3")];
    notes[0].category = { id: "0", label: "AA", _ordinal: 3 };
    notes[1].category = { id: "3", label: "C", _ordinal: 1 };
    notes[2].category = { id: "2", label: "Z", _ordinal: 0 };
    notes[3].category = { id: "1", label: "AB", _ordinal: 2 };
    component.records = notes;
    component.ngOnChanges({ records: undefined });

    component.sort.sort({ id: "category", start: "asc", disableClear: false });
    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((note) => note.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort strings ignoring case", () => {
    const names = ["C", "b", "A"];
    component.records = names.map((name) => Child.create(name));
    component.ngOnChanges({ records: undefined });
    component.sort.sort({ id: "name", start: "asc", disableClear: false });

    const sortedNames = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((row) => row.record["name"]);

    expect(sortedNames).toEqual(["A", "b", "C"]);
  });

  it("should log a warning when the column definition can not be initialized", () => {
    const loggingService = TestBed.inject(LoggingService);
    spyOn(loggingService, "warn");
    component.records = [new Child()];
    component.columns = [
      {
        id: "correctColumn",
        label: "Predefined Title",
        view: "DisplayDate",
      },
      { id: "notExistentColumn" },
    ];

    component.ngOnChanges({ columns: null });

    expect(loggingService.warn).toHaveBeenCalled();
  });

  it("should create a formGroup when editing a row", () => {
    component.columns = ["name", "projectNumber"];
    const child = new Child();
    child.name = "Child Name";
    child.projectNumber = "01";
    const tableRow: TableRow<Entity> = { record: child };
    const media = TestBed.inject(ScreenWidthObserver);
    spyOn(media, "isDesktop").and.returnValue(true);

    component.edit(tableRow);

    const formGroup = tableRow.formGroup;
    expect(formGroup.get("name")).toHaveValue("Child Name");
    expect(formGroup.get("projectNumber")).toHaveValue("01");
    expect(formGroup).toBeEnabled();
  });

  it("should correctly save changes to an entity", fakeAsync(() => {
    TestBed.inject(EntityAbility).update([
      { subject: "Child", action: "create" },
    ]);
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "save").and.resolveTo();
    const fb = TestBed.inject(UntypedFormBuilder);
    const child = new Child();
    child.name = "Old Name";
    const formGroup = fb.group({
      name: "New Name",
      gender: genders[2],
    });
    const tableRow = { record: child, formGroup: formGroup };

    component.save(tableRow);
    tick();

    expect(entityMapper.save).toHaveBeenCalledWith(tableRow.record);
    expect(tableRow.record.name).toBe("New Name");
    expect(tableRow.record.gender).toBe(genders[2]);
    expect(tableRow.formGroup).not.toBeEnabled();
  }));

  it("should show a error message when saving fails", fakeAsync(() => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("Form invalid")
    );
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");

    component.save({ formGroup: null, record: new Child() });
    tick();

    expect(alertService.addDanger).toHaveBeenCalledWith("Form invalid");
  }));

  it("should clear the form group when resetting", () => {
    const row = { record: new Child(), formGroup: new UntypedFormGroup({}) };

    component.resetChanges(row);

    expect(row.formGroup).toBeFalsy();
  });

  it("should create new entities and call the show entity function when it is supplied", fakeAsync(() => {
    const child = new Child();
    component.newRecordFactory = () => child;
    component.columns = [{ id: "name" }, { id: "projectNumber" }];

    component.create();
    tick();

    expect(TestBed.inject(FormDialogService).openSimpleForm).toHaveBeenCalled();
  }));

  it("should create a new entity and open a dialog on default when clicking create", () => {
    const child = new Child();
    component.newRecordFactory = () => child;
    component.ngOnInit();
    const dialog = TestBed.inject(FormDialogService);

    component.create();

    expect(dialog.openSimpleForm).toHaveBeenCalledWith(child, []);
  });

  it("should notify when an entity is clicked", (done) => {
    const child = new Child();
    component.rowClick.subscribe((entity) => {
      expect(entity).toEqual(child);
      done();
    });

    component.onRowClick({ record: child });
  });

  it("should add a new entity that was created after the initial loading to the table", () => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    component.newRecordFactory = () => new Entity();
    component.records = [];
    component.ngOnInit();

    const entity = new Entity();
    entityUpdates.next({ entity: entity, type: "new" });

    expect(component.recordsDataSource.data).toEqual([{ record: entity }]);
  });

  it("should remove a entity from the table when it has been deleted", async () => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    const entity = new Entity();
    component.records = [entity];
    component.ngOnInit();

    expect(component.recordsDataSource.data).toEqual([{ record: entity }]);

    entityUpdates.next({ entity: entity, type: "remove" });

    expect(component.recordsDataSource.data).toEqual([]);
  });

  it("does not change the size of it's records when not saving a new record", async () => {
    const entity = new Entity();
    component.records = [entity];
    await component.save({ record: entity });
    expect(component.recordsDataSource.data).toHaveSize(1);
  });

  it("should correctly determine the entity constructor from factory", () => {
    expect(() => component.getEntityConstructor()).toThrowError();

    const newRecordSpy = jasmine.createSpy().and.returnValue(new Child());
    component.newRecordFactory = newRecordSpy;
    expect(component.getEntityConstructor()).toEqual(Child);
    expect(newRecordSpy).toHaveBeenCalled();
  });

  it("should correctly determine the entity constructor from existing record", () => {
    component.newRecordFactory = undefined;
    component.records = [new Note()];
    expect(component.getEntityConstructor()).toEqual(Note);
  });

  it("should filter data based on filter definition", () => {
    const c1 = Child.create("Matching");
    c1.dateOfBirth = new DateWithAge(moment().subtract(1, "years").toDate());
    const c2 = Child.create("Not Matching");
    c2.dateOfBirth = new DateWithAge(moment().subtract(2, "years").toDate());
    const c3 = Child.create("Matching");
    c3.dateOfBirth = new DateWithAge(moment().subtract(3, "years").toDate());
    // get type-safety for filters
    const childComponent = component as any as EntitySubrecordComponent<Child>;
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

    const c4 = Child.create("Matching");
    c4.dateOfBirth = new DateWithAge(moment().subtract(4, "years").toDate());
    const c5 = Child.create("Not Matching");

    childComponent.records = [c1, c2, c3, c4, c5];

    expect(childComponent.recordsDataSource.data).toEqual([
      { record: c3 },
      { record: c4 },
    ]);
  });

  it("should remove an entity if it does not pass the filter anymore", fakeAsync(() => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const child = new Child();
    child.gender = genders[1];
    entityMapper.save(child);
    tick();
    component.records = [child];
    component.filter = { "gender.id": genders[1].id } as any;
    component.ngOnInit();

    expect(component.recordsDataSource.data).toEqual([{ record: child }]);

    child.gender = genders[2];
    entityMapper.save(child);
    tick(5000);

    expect(component.recordsDataSource.data).toEqual([]);
  }));
});
