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
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { Entity } from "../../../entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { DatePipe, PercentPipe } from "@angular/common";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { AlertService } from "../../../alerts/alert.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { LoggingService } from "../../../logging/logging.service";
import { MockSessionModule } from "../../../session/mock-session.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import moment from "moment";
import {
  viewRegistry,
  VIEWS,
} from "../../../view/dynamic-components/dynamic-component.decorator";
import {
  ENTITIES,
  entityRegistry,
} from "../../../entity/database-entity.decorator";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent<Entity>;
  let fixture: ComponentFixture<EntitySubrecordComponent<Entity>>;
  let entityMapper: EntityMapperService;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          EntitySubrecordModule,
          RouterTestingModule.withRoutes([]),
          MatNativeDateModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
          FontAwesomeTestingModule,
        ],
        providers: [
          DatePipe,
          PercentPipe,
          { provide: ENTITIES, useValue: entityRegistry },
          { provide: VIEWS, useValue: viewRegistry },
        ],
      }).compileComponents();

      entityMapper = TestBed.inject(EntityMapperService);
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
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
    component.columns = [
      {
        id: "enumValue",
        label: "Test Configurable Enum",
        view: "DisplayConfigurableEnum",
      },
    ];
    component.ngOnChanges({ records: undefined, columns: undefined });
    fixture.detectChanges();

    component.recordsDataSource.sort.sort({
      id: "enumValue",
      start: "asc",
      disableClear: false,
    });

    const sortedData = component.recordsDataSource
      .sortData(component.recordsDataSource.data, component.sort)
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
      .sortData(component.recordsDataSource.data, component.sort)
      .map((c) => c.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort non-standard objects", () => {
    const notes = [new Note("0"), new Note("1"), new Note("2"), new Note("3")];
    notes[0].category = { id: "0", label: "AA" };
    notes[3].category = { id: "1", label: "AB" };
    notes[2].category = { id: "2", label: "Z" };
    notes[1].category = { id: "3", label: "C" };
    component.records = notes;
    component.ngOnChanges({ records: null });

    component.sort.sort({ id: "category", start: "asc", disableClear: false });
    const sortedIds = component.recordsDataSource
      .sortData(component.recordsDataSource.data, component.sort)
      .map((note) => note.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
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
    component.columns = [{ id: "name" }, { id: "projectNumber" }];
    const child = new Child();
    child.name = "Child Name";
    child.projectNumber = "01";
    const tableRow: TableRow<Child> = { record: child };

    component.edit(tableRow);

    const formGroup = tableRow.formGroup;
    expect(formGroup.get("name").value).toBe("Child Name");
    expect(formGroup.get("projectNumber").value).toBe("01");
    expect(formGroup.enabled).toBeTrue();
  });

  it("should correctly save changes to an entity", fakeAsync(() => {
    spyOn(entityMapper, "save").and.resolveTo();
    const fb = TestBed.inject(FormBuilder);
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
    expect(tableRow.formGroup.disabled).toBeTrue();
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
    const row = { record: new Child(), formGroup: new FormGroup({}) };

    component.resetChanges(row);

    expect(row.formGroup).toBeFalsy();
  });

  it("should create new entities and call the show entity function when it is supplied", fakeAsync(() => {
    const child = new Child();
    component.newRecordFactory = () => child;
    component.columns = [{ id: "name" }, { id: "projectNumber" }];
    component.showEntity = jasmine.createSpy("showEntity");

    component.create();
    tick();

    expect(component.showEntity).toHaveBeenCalledWith(child);
  }));

  it("should create new entities and open it in a row when no show entity function is supplied", fakeAsync(() => {
    const child = new Child();
    component.newRecordFactory = () => child;
    const spy = spyOn<any>(component, "showRowDetails");

    component.create();
    tick();

    expect(spy).toHaveBeenCalledWith({ record: child }, true);
  }));

  it("should notify when an entity is clicked", (done) => {
    const child = new Child();
    component.showEntity = (entity) => {
      expect(entity).toEqual(child);
      done();
    };

    component.rowClick({ record: child });
  });

  it("should add a new entity to the the table when it's new", async () => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.resolveTo();
    component.records = [];
    const entity = new Entity();
    await component.save({ record: entity }, true);
    expect(component.recordsDataSource.data).toHaveSize(1);
  });

  it("does not change the size of it's records when not saving a new record", async () => {
    const entity = new Entity();
    component.records = [entity];
    await component.save({ record: entity }, false);
    expect(component.recordsDataSource.data).toHaveSize(1);
  });
});
