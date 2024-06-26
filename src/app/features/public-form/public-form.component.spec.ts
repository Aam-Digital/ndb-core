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
import { Child } from "../../child-dev-project/children/model/child";
import { genders } from "../../child-dev-project/children/model/genders";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EntityFormService } from "../../core/common-components/entity-form/entity-form.service";
import { ConfigService } from "../../core/config/config.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";

describe("PublicFormComponent", () => {
  let component: PublicFormComponent<Child>;
  let fixture: ComponentFixture<PublicFormComponent<Child>>;
  let initRemoteDBSpy: jasmine.Spy;
  let testFormConfig: PublicFormConfig;

  beforeEach(waitForAsync(() => {
    testFormConfig = new PublicFormConfig("form-id");
    testFormConfig.title = "test form";
    testFormConfig.entity = "Child";
    testFormConfig.columns = [["name"], ["gender"]];
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

    fixture = TestBed.createComponent(PublicFormComponent<Child>);
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
    testFormConfig.entity = "Child";

    initComponent();
    tick();

    expect(component.entity.getConstructor()).toBe(Child);
    expect(component.formConfig.title).toBe("Some test title");
  }));

  it("should prefill entity with transformed values", fakeAsync(() => {
    testFormConfig.prefilled = { status: "new", gender: "M" };
    initComponent();
    tick();

    expect(component.entity.status).toBe("new");
    expect(component.entity.gender).toBe(genders.find(({ id }) => id === "M"));
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
    expect(component.form.formGroup.get("name")).toHaveValue(null);
  }));

  it("should reset the form when clicking reset", fakeAsync(() => {
    initComponent();
    tick();
    component.form.formGroup.get("name").setValue("some name");
    expect(component.form.formGroup.get("name")).toHaveValue("some name");

    component.reset();
    tick();

    expect(component.form.formGroup.get("name")).toHaveValue(null);
  }));

  function initComponent() {
    TestBed.inject(EntityMapperService).save(testFormConfig);
    const configService = TestBed.inject(ConfigService);
    configService.entityUpdated.next(configService["currentConfig"]);
  }
});
