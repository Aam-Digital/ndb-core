import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { PublicFormComponent } from "./public-form.component";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { PouchDatabase } from "../../core/database/pouch-database";
import { PublicFormConfig } from "./public-form-config";
import { ActivatedRoute } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EntityFormService } from "../../core/common-components/entity-form/entity-form.service";
import { ConfigService } from "../../core/config/config.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { InvalidFormFieldError } from "../../core/common-components/entity-form/invalid-form-field.error";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";

describe("PublicFormComponent", () => {
  let component: PublicFormComponent<TestEntity>;
  let fixture: ComponentFixture<PublicFormComponent<TestEntity>>;
  let initRemoteDBSpy: jasmine.Spy;
  let testFormConfig: PublicFormConfig;

  beforeEach(waitForAsync(() => {
    testFormConfig = new PublicFormConfig("form-id");
    testFormConfig.title = "test form";
    testFormConfig.entity = "TestEntity";
    testFormConfig.columns = [
      {
        fields: [
          {
            id: "name",
            defaultValue: { mode: "static", value: "default name" },
          },
          "category",
        ],
      },
    ];
    TestBed.configureTestingModule({
      imports: [PublicFormComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: new Map([["id", testFormConfig.getId(true)]]),
            },
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    initRemoteDBSpy = spyOn(TestBed.inject(PouchDatabase), "initRemoteDB");

    fixture = TestBed.createComponent(PublicFormComponent<TestEntity>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize remote DB on startup", () => {
    expect(initRemoteDBSpy).toHaveBeenCalled();
  });

  it("should initialize component with values from PublicFormConfig once config is ready", fakeAsync(() => {
    expect(component.entity).toBeUndefined();
    testFormConfig.title = "Some test title";
    testFormConfig.entity = "TestEntity";

    initComponent();
    tick();

    expect(component.entity.getConstructor()).toBe(TestEntity);
    expect(component.formConfig.title).toBe("Some test title");
  }));

  it("should show a snackbar and reset form when the form has been submitted", fakeAsync(() => {
    initComponent();
    tick();
    const openSnackbarSpy = spyOn(TestBed.inject(MatSnackBar), "open");
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    saveSpy.and.resolveTo();
    component.form.formGroup.get("name").setValue("some name");

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(
      component.form.formGroup,
      component.entity,
    );
    tick();
    expect(openSnackbarSpy).toHaveBeenCalled();
  }));

  it("should show a snackbar error and not reset when trying to submit invalid form", fakeAsync(() => {
    initComponent();
    tick();
    const openSnackbarSpy = spyOn(TestBed.inject(MatSnackBar), "open");
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    saveSpy.and.throwError(new InvalidFormFieldError());
    component.form.formGroup.get("name").setValue("some name");

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(
      component.form.formGroup,
      component.entity,
    );
    tick();
    expect(openSnackbarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("invalid"),
    );
    expect(component.form.formGroup.get("name")).toHaveValue("some name");
  }));

  it("should reset the form when clicking reset", fakeAsync(() => {
    initComponent();
    tick();
    component.form.formGroup.get("name").setValue("some name");
    expect(component.form.formGroup.get("name")).toHaveValue("some name");

    component.reset();
    tick();
  }));

  it("should set default value for field", fakeAsync(() => {
    const config = new PublicFormConfig();
    config.entity = TestEntity.ENTITY_TYPE;
    config.columns = [
      {
        fields: [
          {
            id: "name",
            defaultValue: { mode: "static", value: "default name" },
          },
        ],
      },
    ];
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(config);

    initComponent();
    tick();

    expect(component.form.formGroup.get("name")).toHaveValue("default name");
  }));

  it("should migrate old PublicFormConfig format to be backwards compatible", fakeAsync(() => {
    const legacyConfig = {
      _id: "PublicFormConfig:old-form",
      title: "Old Form",
      entity: TestEntity.ENTITY_TYPE,
      columns: [["name"]], // string[][];
      prefilled: { name: "default name" }, // { [key in string]: any };
    };
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(
      legacyConfig as any,
    );

    initComponent();
    tick();

    expect(component.form.formGroup.get("name")).toHaveValue("default name");
  }));

  it("should throw an error when do not have permissions to submit the form", fakeAsync(() => {
    TestBed.inject(EntityAbility).update([
      {
        subject: "Child",
        action: "create",
      },
    ]);
    (testFormConfig.entity = "School"),
      (testFormConfig.title = "Some test title");
    initComponent();
    tick();
    expect(component).toBeDefined();
    expect(component.publicFormNotFound.error).toBe(
      "You do not have the required permissions to submit this form. Please log in or contact your system administrator.",
    );
  }));

  function initComponent() {
    TestBed.inject(EntityMapperService).save(testFormConfig);
    const configService = TestBed.inject(ConfigService);
    configService.entityUpdated.next(configService["currentConfig"]);
  }
});
