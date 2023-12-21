import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EntitiesTableComponent, TableRow } from "./entities-table.component";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { Note } from "../../../child-dev-project/notes/model/note";
import moment from "moment/moment";
import { Child } from "../../../child-dev-project/children/model/child";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { genders } from "../../../child-dev-project/children/model/genders";
import { EntityFormService } from "../entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";

describe("EntityTableComponent", () => {
  let component: EntitiesTableComponent<Entity>;
  let fixture: ComponentFixture<EntitiesTableComponent<Entity>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitiesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitiesTableComponent);
    component = fixture.componentInstance;
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
    component.customColumns = ["date", "subject"];
    component.columnsToDisplay = ["date", "subject"];
    component.records = [];

    const oldNote = Note.create(moment().subtract(1, "day").toDate());
    const newNote = Note.create(new Date());
    component.records = [oldNote, newNote];

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

    component.sort.sort({ id: "category", start: "asc", disableClear: false });
    const sortedIds = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((note) => note.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort strings ignoring case", () => {
    const names = ["C", "A", "b"];
    component.records = names.map((name) => Child.create(name));
    component.sort.sort({ id: "resetSort", start: "asc", disableClear: false });

    component.sort.sort({ id: "name", start: "asc", disableClear: false });

    const sortedNames = component.recordsDataSource
      ._orderData(component.recordsDataSource.data)
      .map((row) => row.record["name"]);

    expect(sortedNames).toEqual(["A", "b", "C"]);
  });

  it("should create a formGroup when editing a row", () => {
    component.customColumns = ["name", "projectNumber"];

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
      new Error("Form invalid"),
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
    component.customColumns = [{ id: "name" }, { id: "projectNumber" }];

    component.create();
    tick();

    expect(TestBed.inject(FormDialogService).openFormPopup).toHaveBeenCalled();
  }));

  it("should create a new entity and open a dialog on default when clicking create", () => {
    const child = new Child();
    component.newRecordFactory = () => child;

    const dialog = TestBed.inject(FormDialogService);

    component.create();

    const defaultTestColumns = []; // TODO: what was this test case?
    expect(dialog.openFormPopup).toHaveBeenCalledWith(
      child,
      defaultTestColumns.map((x) => jasmine.objectContaining({ id: x })),
    );
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

  it("should filter data based on filter definition", () => {
    const c1 = Child.create("Matching");
    c1.dateOfBirth = new DateWithAge(moment().subtract(1, "years").toDate());
    const c2 = Child.create("Not Matching");
    c2.dateOfBirth = new DateWithAge(moment().subtract(2, "years").toDate());
    const c3 = Child.create("Matching");
    c3.dateOfBirth = new DateWithAge(moment().subtract(3, "years").toDate());
    // get type-safety for filters
    const childComponent = component as any as EntitiesTableComponent<Child>;
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

    expect(component.recordsDataSource.data).toEqual([{ record: child }]);

    child.gender = genders[2];
    entityMapper.save(child);
    tick(5000);

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
});
