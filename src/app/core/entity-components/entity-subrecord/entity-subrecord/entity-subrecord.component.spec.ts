import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { Entity } from "../../../entity/entity";
import { SimpleChange } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { DatePipe, PercentPipe } from "@angular/common";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { AlertService } from "../../../alerts/alert.service";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent<Entity>;
  let fixture: ComponentFixture<EntitySubrecordComponent<Entity>>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["remove", "save"]);

      TestBed.configureTestingModule({
        imports: [
          EntitySubrecordModule,
          RouterTestingModule,
          MatNativeDateModule,
          NoopAnimationsModule,
        ],
        providers: [
          DatePipe,
          PercentPipe,
          { provide: EntityMapperService, useValue: mockEntityMapper },
        ],
      }).compileComponents();
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
        placeholder: "Test Configurable Enum",
        view: "DisplayConfigurableEnum",
      },
    ];
    component.ngOnChanges({
      records: new SimpleChange(undefined, component.records, true),
      columns: new SimpleChange(undefined, component.columns, true),
    });
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

  it("should apply default sort on first column", async () => {
    const children = [Child.create("C"), Child.create("A"), Child.create("B")];
    component.columnsToDisplay = ["name", "projectNumber"];
    component.records = children;
    // trigger ngOnChanges for manually updated property
    component.ngOnChanges({
      records: new SimpleChange(undefined, children, true),
    });

    const sortedChildren = component.recordsDataSource
      .sortData(
        children.map((child) => {
          return { record: child };
        }),
        component.sort
      )
      .map((c) => c.record["name"]);

    expect(sortedChildren).toEqual(["A", "B", "C"]);
  });

  it("should apply default sort on first column, ordering dates descending", async () => {
    const children = [Child.create("0"), Child.create("1"), Child.create("2")];
    children[0].admissionDate = new Date(2010, 1, 1);
    children[1].admissionDate = new Date(2011, 1, 1);
    children[2].admissionDate = new Date(2012, 1, 1);

    component.columnsToDisplay = ["admissionDate", "name"];
    component.records = children;
    // define the columns to mark "admissionDate" as a Date value
    component.columns = [
      {
        view: "DisplayDate",
        placeholder: "Admission",
        id: "admissionDate",
      },
      {
        view: "DisplayText",
        placeholder: "Name",
        id: "name",
      },
    ];

    component.ngOnChanges({
      records: new SimpleChange(undefined, children, true),
    });
    fixture.detectChanges();

    const sortedChildren = component.recordsDataSource
      ._orderData(
        children.map((child) => {
          return { record: child };
        })
      )
      .map((c) => c.record["name"]);

    expect(sortedChildren).toEqual(["2", "1", "0"]);
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
    component.ngOnChanges({ records: null });
    component.sort.sort({ id: "name", start: "asc", disableClear: false });

    const sortedIds = component.recordsDataSource
      .sortData(
        children.map((child) => {
          return { record: child };
        }),
        component.sort
      )
      .map((c) => c.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort non-standard objects", () => {
    const notes = [new Note("0"), new Note("1"), new Note("2"), new Note("3")];
    notes[0].category = { id: "0", label: "AA" };
    notes[3].category = { id: "1", label: "AB" };
    notes[2].category = { id: "2", label: "Z" };
    notes[1].category = { id: "3", label: "C" };
    component.ngOnChanges({ records: null });

    component.sort.sort({ id: "category", start: "asc", disableClear: false });
    const sortedIds = component.recordsDataSource
      .sortData(
        notes.map((note) => {
          return { record: note };
        }),
        component.sort
      )
      .map((note) => note.record.getId());

    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should log an error when the column definition can not be initialized", () => {
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addWarning");
    component.records = [new Child()];
    component.columns = [
      {
        id: "correctColumn",
        placeholder: "Predefined Title",
        view: "DisplayDate",
      },
      { id: "notExistentColumn" },
    ];

    component.ngOnChanges({ columns: null });

    expect(alertService.addWarning).toHaveBeenCalled();
  });
});
