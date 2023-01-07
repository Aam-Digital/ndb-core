import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { PublicFormComponent } from "./public-form.component";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { PouchDatabase } from "../../core/database/pouch-database";
import { PublicFormConfig } from "./public-form-config";
import { LoginState } from "../../core/session/session-states/login-state.enum";
import { ActivatedRoute } from "@angular/router";
import { Child } from "../../child-dev-project/children/model/child";
import { genders } from "../../child-dev-project/children/model/genders";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EntityFormService } from "../../core/entity-components/entity-form/entity-form.service";
import { ConfigService } from "../../core/config/config.service";

describe("PublicFormComponent", () => {
  let component: PublicFormComponent<Child>;
  let fixture: ComponentFixture<PublicFormComponent<Child>>;
  let initIndexedDBSpy: jasmine.Spy;
  const formConfigID = "form-id";
  let initConfig: () => void;

  beforeEach(async () => {
    const formConfig = new PublicFormConfig(formConfigID);
    formConfig.title = "test form";
    formConfig.entity = "Child";
    formConfig.columns = [["name"], ["gender"]];
    formConfig.prefilled = { status: "new", gender: "M" };
    await TestBed.configureTestingModule({
      imports: [
        PublicFormComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [formConfig]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([["id", formConfigID]]) } },
        },
      ],
    }).compileComponents();

    initIndexedDBSpy = spyOn(TestBed.inject(PouchDatabase), "initIndexedDB");
    initConfig = () => {
      const configService = TestBed.inject(ConfigService);
      configService["_configUpdates"].next(configService["currentConfig"]);
    };

    fixture = TestBed.createComponent(PublicFormComponent<Child>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize remote DB on startup", () => {
    expect(initIndexedDBSpy).toHaveBeenCalled();
  });

  it("should initialize component with values from PublicFormConfig once config is ready", fakeAsync(() => {
    expect(component.entity).toBeUndefined();

    initConfig();
    tick();

    expect(component.entity.getConstructor()).toBe(Child);
    expect(component.title).toBe("test form");
  }));

  it("should prefill entity with transformed values", fakeAsync(() => {
    initConfig();
    tick();

    expect(component.entity.status).toBe("new");
    expect(component.entity.gender).toBe(genders.find(({ id }) => id === "M"));
  }));

  it("should show a snackbar and reset form when the form has been submitted", fakeAsync(() => {
    initConfig();
    tick();
    const openSnackbarSpy = spyOn(TestBed.inject(MatSnackBar), "open");
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    saveSpy.and.resolveTo();
    component.form.get("name").setValue("some name");

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(component.form, component.entity);
    tick();
    expect(openSnackbarSpy).toHaveBeenCalled();
    expect(component.form.get("name")).toHaveValue(null);
  }));

  it("should reset the form when clicking reset", fakeAsync(() => {
    initConfig();
    tick();
    component.form.get("name").setValue("some name");
    expect(component.form.get("name")).toHaveValue("some name");

    component.reset();

    expect(component.form.get("name")).toHaveValue(null);
  }));
});
