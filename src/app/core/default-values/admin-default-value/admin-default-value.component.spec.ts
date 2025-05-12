import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueComponent } from "./admin-default-value.component";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../../entity/model/entity";
import { DefaultValueConfig } from "../default-value-config";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { StaticDefaultValueService } from "../x-static/static-default-value.service";
import { DynamicPlaceholderValueService } from "../x-dynamic-placeholder/dynamic-placeholder-value.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { componentRegistry, ComponentRegistry } from "app/dynamic-components";

describe("AdminDefaultValueComponent", () => {
  let component: AdminDefaultValueComponent;
  let fixture: ComponentFixture<AdminDefaultValueComponent>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
      "extendFormFieldConfig",
    ]);
    await TestBed.configureTestingModule({
      imports: [
        AdminDefaultValueComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntityRegistry,
        {
          provide: DefaultValueStrategy,
          useClass: StaticDefaultValueService,
          multi: true,
        },
        {
          provide: DefaultValueStrategy,
          useClass: DynamicPlaceholderValueService,
          multi: true,
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
        { provide: ComponentRegistry, useValue: componentRegistry },
        CurrentUserSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.entityType = Entity;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset form fields when mode field is changed", () => {
    const newMode = "dynamic";
    component.form.get("mode").setValue(newMode);

    expect(component.form.get("config").value).toBeNull();
    expect(component.form.get("mode").value).toBe(newMode);
  });

  it("should auto-select static mode when value is added and mode is undefined", () => {
    component.form.get("mode").setValue(undefined); // Simulate mode not being set
    component.form.get("config").setValue({ value: "Some value" });
    expect(component.form.get("mode").value).toEqual("static");
  });

  it("should emit valueChange event when changed form is valid", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "static",
      config: {
        value: "New value",
      },
    } as DefaultValueConfig);
    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        mode: "static",
        config: { value: "New value" },
      } as DefaultValueConfig),
    );
  });

  it("should not emit valueChange event when changed form is invalid", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "static",
      config: null,
    } as DefaultValueConfig);
    expect(component.valueChange.emit).not.toHaveBeenCalled();
  });

  it("clearDefaultValue should clear the form and emit undefined value", () => {
    component.form.setValue({
      mode: "dynamic",
      config: {
        value: "Test value",
        localAttribute: "x",
        field: "y",
      },
    });
    spyOn(component.valueChange, "emit");

    component.clearDefaultValue();

    expect(component.form.get("mode").value).toBeNull();
    expect(component.form.get("config").value).toBeNull();
    expect(component.valueChange.emit).toHaveBeenCalledWith(null);
  });

  it("should apply input values to form", () => {
    component.value = { mode: "dynamic", config: { value: "Test value" } };
    component.ngOnInit();
    expect(component.form.get("mode").value).toEqual("dynamic");
    expect(component.form.get("config").value).toEqual({ value: "Test value" });
  });
});
