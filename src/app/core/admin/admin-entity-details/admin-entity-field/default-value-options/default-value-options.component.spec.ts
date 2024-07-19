import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DefaultValueOptionsComponent } from "./default-value-options.component";
import { EntityRegistry } from "../../../../entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityDatatype } from "../../../../basic-datatypes/entity/entity.datatype";
import { Entity, EntityConstructor } from "../../../../entity/model/entity";

describe("DefaultValueOptionsComponent", () => {
  let component: DefaultValueOptionsComponent;
  let fixture: ComponentFixture<DefaultValueOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DefaultValueOptionsComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultValueOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.entityType = Entity;
    component.inheritedFieldSelectElement = jasmine.createSpyObj(["open"]);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset form fields when mode field is changed", () => {
    const newMode = "dynamic";
    component.form.get("mode").setValue(newMode);

    expect(component.form.get("value").value).toBeNull();
    expect(component.form.get("localAttribute").value).toBeNull();
    expect(component.form.get("field").value).toBeNull();
    expect(component.mode).toBe(newMode);
  });

  it("should auto-select static mode when value is added and mode is undefined", () => {
    component.mode = undefined; // Simulate mode not being set
    component.form.get("value").setValue("Some value");
    expect(component.mode).toEqual("static");
  });

  it("should emit valueChange event when changed form is valid (static mode)", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "static",
      value: "New value",
      localAttribute: null,
      field: null,
    });
    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ mode: "static", value: "New value" }),
    );
  });
  it("should emit valueChange event when changed form is valid (dynamic mode)", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "dynamic",
      value: "New value",
      localAttribute: null,
      field: null,
    });
    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ mode: "dynamic", value: "New value" }),
    );
  });
  it("should emit valueChange event when changed form is valid (inherited mode)", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "inherited",
      value: null,
      localAttribute: "localAttribute",
      field: "field",
    });
    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        mode: "inherited",
        localAttribute: "localAttribute",
        field: "field",
      }),
    );
  });
  it("should not emit valueChange event when changed form is invalid", () => {
    spyOn(component.valueChange, "emit");
    component.form.setValue({
      mode: "static",
      value: null,
      localAttribute: null,
      field: null,
    });
    expect(component.valueChange.emit).not.toHaveBeenCalled();

    component.form.setValue({
      mode: "inherited",
      value: null,
      localAttribute: "foo",
      field: null,
    });
    // TODO: why is this a valid form with the required "field" value missing?
    expect(component.valueChange.emit).not.toHaveBeenCalled();
  });

  it("clearDefaultValue should clear the form and emit undefined value", () => {
    component.form.setValue({
      mode: "dynamic",
      value: "Test value",
      localAttribute: "x",
      field: "y",
    });
    spyOn(component.valueChange, "emit");

    component.clearDefaultValue();

    expect(component.form.get("mode").value).toBeUndefined();
    expect(component.form.get("value").value).toBeUndefined();
    expect(component.valueChange.emit).toHaveBeenCalledWith(undefined);
  });

  it("should apply input values to form", () => {
    component.value = { mode: "dynamic", value: "Test value" };
    component.ngOnChanges({ value: { currentValue: component.value } as any });
    expect(component.form.get("mode").value).toEqual("dynamic");
    expect(component.form.get("value").value).toEqual("Test value");

    component.value = { mode: "inherited", localAttribute: "x", field: "y" };
    component.ngOnChanges({ value: { currentValue: component.value } as any });
    expect(component.form.get("localAttribute").value).toEqual("x");
    expect(component.form.get("field").value).toEqual("y");
  });

  it("should load inheritance attribute options when entityType is set", () => {
    component.entityType = {
      schema: new Map([
        ["ref1", { dataType: EntityDatatype.dataType }],
        ["otherField", { dataType: "string" }],
        ["ref2", { dataType: EntityDatatype.dataType }],
      ]),
    } as any; // Mock entityType with schema

    component.ngOnChanges({
      entityType: { currentValue: component.entityType } as any,
    });

    expect(component.availableInheritanceAttributes).toEqual(["ref1", "ref2"]);
  });

  it("should load inheritance field options when localAttribute is set", () => {
    component.entityType = {
      schema: new Map([
        [
          "ref1",
          { dataType: EntityDatatype.dataType, additional: "OtherType" },
        ],
      ]),
    } as any; // Mock entityType with schema
    const OtherTypeMock: EntityConstructor = {
      schema: new Map([
        ["field1", { dataType: "string", label: "F1" }],
        ["fieldWithoutLabel", { dataType: "string" }],
        ["field2", { dataType: "string", label: "F2" }],
      ]),
    } as any;
    spyOn(TestBed.inject(EntityRegistry), "get").and.returnValue(OtherTypeMock);

    component.form.get("localAttribute").setValue("ref1");

    expect(component.currentInheritanceFields).toEqual({
      localAttribute: "ref1",
      referencedEntityType: OtherTypeMock,
      availableFields: ["field1", "field2"],
    });
  });
});
