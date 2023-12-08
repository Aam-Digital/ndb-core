import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AdminEntityFormComponent } from "./admin-entity-form.component";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Note } from "../../../child-dev-project/notes/model/note";
import { FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { of } from "rxjs";
import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { AdminModule } from "../admin.module";
import { FormConfig } from "../../entity-details/form/form.component";

describe("AdminEntityFormComponent", () => {
  let component: AdminEntityFormComponent;
  let fixture: ComponentFixture<AdminEntityFormComponent>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  let testConfig: FormConfig;

  beforeEach(() => {
    testConfig = {
      fieldGroups: [
        { header: "Group 1", fields: ["subject", "date"] },
        { fields: ["category"] },
      ],
    };

    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createFormGroup",
    ]);
    mockFormService.createFormGroup.and.returnValue(new FormGroup({}));
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      imports: [
        AdminModule,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: EntityFormService,
          useValue: mockFormService,
        },
        {
          provide: MatDialog,
          useValue: mockDialog,
        },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityFormComponent);
    component = fixture.componentInstance;

    component.config = testConfig;
    component.entityType = Note;

    fixture.detectChanges();

    component.ngOnChanges({ config: true as any });
  });

  it("should create and init a form", () => {
    expect(component).toBeTruthy();

    expect(component.dummyEntity).toBeTruthy();
    expect(component.dummyForm).toBeTruthy();
  });

  it("should load all fields from schema that are not already in form as available fields", () => {
    const fieldsInView = ["date"];
    component.config = {
      fieldGroups: [{ fields: fieldsInView }],
    };
    component.ngOnChanges({ config: true as any });

    const noteUserFacingFields = Array.from(Note.schema.entries())
      .filter(([key, value]) => value.label)
      .map(([key]) => key);
    expect(component.availableFields).toEqual([
      component.createNewFieldPlaceholder,
      ...noteUserFacingFields.filter((x) => !fieldsInView.includes(x)),
    ]);
  });

  function mockDropNewFieldEvent(
    targetContainer: ColumnConfig[],
    previousContainer?: ColumnConfig[],
    previousIndex?: number,
  ) {
    previousContainer = previousContainer ?? component.availableFields;
    previousIndex = previousIndex ?? 0; // "new field" placeholder is always first

    return {
      container: { data: targetContainer },
      currentIndex: 1,
      previousContainer: { data: previousContainer },
      previousIndex: previousIndex,
    } as Partial<CdkDragDrop<ColumnConfig[], ColumnConfig[]>> as CdkDragDrop<
      ColumnConfig[],
      ColumnConfig[]
    >;
  }

  it("should add new field in view if field config dialog succeeds", fakeAsync(() => {
    const newFieldId = "test-created-field";
    mockDialog.open.and.returnValue({
      afterClosed: () => of(newFieldId),
    } as any);

    const targetContainer = component.config.fieldGroups[0].fields;
    component.drop(mockDropNewFieldEvent(targetContainer));
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(targetContainer).toEqual(["subject", newFieldId, "date"]);
    expect(component.availableFields).toContain(
      component.createNewFieldPlaceholder,
    );
  }));

  it("should not add new field in view if field config dialog is cancelled", fakeAsync(() => {
    mockDialog.open.and.returnValue({ afterClosed: () => of("") } as any);

    const targetContainer = component.config.fieldGroups[0].fields;
    component.drop(mockDropNewFieldEvent(targetContainer));
    tick();

    expect(targetContainer).toEqual(["subject", "date"]);
    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.availableFields).toContain(
      component.createNewFieldPlaceholder,
    );
  }));

  it("should not create field (show dialog) if new field is dropped on toolbar (available fields)", fakeAsync(() => {
    component.drop(mockDropNewFieldEvent(component.availableFields));
    tick();

    expect(mockDialog.open).not.toHaveBeenCalled();
  }));

  it("should create a new fieldGroup in config on dropping field in new-group drop area", fakeAsync(() => {
    const field = component.config.fieldGroups[0].fields[0];
    const dropEvent = mockDropNewFieldEvent(
      null,
      component.config.fieldGroups[0].fields,
      0,
    );
    component.dropNewGroup(dropEvent);
    tick();

    expect(component.config.fieldGroups[2]).toEqual({ fields: [field] });
  }));

  it("should move all fields from removed group to availableFields toolbar", fakeAsync(() => {
    const removedFields = component.config.fieldGroups[0].fields;
    expect(
      removedFields.some((x) => component.availableFields.includes(x)),
    ).not.toBeTrue();

    component.removeGroup(0);
    tick();

    expect(component.config.fieldGroups).toEqual([{ fields: ["category"] }]);
    expect(component.availableFields).toEqual(
      jasmine.arrayContaining(removedFields),
    );
  }));
});
