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
import { FormBuilder, FormGroup } from "@angular/forms";
import { Gender } from "../../../../child-dev-project/children/model/Gender";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { Subject } from "rxjs";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SessionService } from "../../../session/session-service/session.service";
import { User } from "../../../user/user";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent<Entity>;
  let fixture: ComponentFixture<EntitySubrecordComponent<Entity>>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["remove", "save"]);
      const mockSessionService = jasmine.createSpyObj<SessionService>([
        "getCurrentUser",
      ]);
      mockSessionService.getCurrentUser.and.returnValue(new User());

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
          { provide: SessionService, useValue: mockSessionService },
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

  it("should correctly save changes to a entity", fakeAsync(() => {
    mockEntityMapper.save.and.resolveTo();
    const fb = TestBed.inject(FormBuilder);
    const child = new Child();
    child.name = "Old Name";
    const formGroup = fb.group({
      name: "New Name",
      gender: Gender.FEMALE,
    });

    component.save({ record: child, formGroup: formGroup });
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(child);
    expect(child.name).toBe("New Name");
    expect(child.gender).toBe(Gender.FEMALE);
    expect(formGroup.disabled).toBeTrue();
  }));

  it("should show a error message when saving fails", fakeAsync(() => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("Form invalid")
    );
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");

    component.save({ formGroup: null, record: null });
    tick();

    expect(alertService.addDanger).toHaveBeenCalledWith("Form invalid");
  }));

  it("should clear the form group when resetting", () => {
    const row = { record: new Child(), formGroup: new FormGroup({}) };

    component.resetChanges(row);

    expect(row.formGroup).toBeFalsy();
  });

  it("should save a deleted entity when clicking the popup", fakeAsync(() => {
    const dialogService = TestBed.inject(ConfirmationDialogService);
    const dialogObservable = new Subject();
    spyOn(dialogService, "openDialog").and.returnValue({
      afterClosed: () => dialogObservable,
    } as any);
    const snackbarService = TestBed.inject(MatSnackBar);
    const snackbarObservable = new Subject();
    spyOn(snackbarService, "open").and.returnValue({
      onAction: () => snackbarObservable,
    } as any);
    mockEntityMapper.remove.and.resolveTo();
    const child = new Child();
    component.records = [child];

    component.delete({ record: child });
    tick();
    expect(component.records).toEqual([child]);

    dialogObservable.next(true);
    tick();
    expect(mockEntityMapper.remove).toHaveBeenCalledWith(child);
    expect(component.records).toEqual([]);

    snackbarObservable.next();
    expect(mockEntityMapper.save).toHaveBeenCalledWith(child, true);
    expect(component.records).toEqual([child]);
  }));

  it("should create new entities and make them editable", () => {
    const child = new Child();
    component.newRecordFactory = () => child;
    component.columns = [{ id: "name" }, { id: "projectNumber" }];

    component.create();

    expect(component.records).toEqual([child]);
    const tableRow = component.recordsDataSource.data.find(
      (row) => row.record === child
    );
    expect(tableRow.formGroup.enabled).toBeTrue();
  });

  it("should notify when an entity is clicked", (done) => {
    const child = new Child();
    component.showEntity = (entity) => {
      expect(entity).toEqual(child);
      done();
    };

    component.rowClick({ record: child });
  });
});
