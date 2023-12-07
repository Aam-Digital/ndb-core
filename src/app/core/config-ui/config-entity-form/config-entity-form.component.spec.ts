import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  ConfigEntityFormComponent,
  FormConfig,
} from "./config-entity-form.component";
import { ConfigUiModule } from "../config-ui.module";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Note } from "../../../child-dev-project/notes/model/note";
import { FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigEntityFormComponent", () => {
  let component: ConfigEntityFormComponent;
  let fixture: ComponentFixture<ConfigEntityFormComponent>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;

  const testConfig: FormConfig = {
    fieldGroups: [
      { header: "Group 1", fields: ["subject", "date"] },
      { header: "Group 2", fields: ["category"] },
    ],
  };

  beforeEach(() => {
    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createFormGroup",
    ]);
    mockFormService.createFormGroup.and.returnValue(new FormGroup({}));

    TestBed.configureTestingModule({
      imports: [
        ConfigUiModule,
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
          useValue: jasmine.createSpyObj(["open"]),
        },
      ],
    });
    fixture = TestBed.createComponent(ConfigEntityFormComponent);
    component = fixture.componentInstance;

    component.config = testConfig;
    component.entityType = Note;

    fixture.detectChanges();
  });

  it("should create and init a form", () => {
    expect(component).toBeTruthy();

    component.ngOnChanges({ config: true as any });

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

  it("should add new field in view if field config dialog succeeds", () => {
    expect(component).toBeTruthy();
    // TODO
  });

  it("should not add new field in view if field config dialog is cancelled", () => {
    expect(component).toBeTruthy();
    // TODO
  });
});
