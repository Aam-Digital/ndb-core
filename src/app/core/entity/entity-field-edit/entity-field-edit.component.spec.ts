import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";

import { ComponentRegistry } from "../../../dynamic-components";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { Entity } from "../model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { CurrentRecordContext } from "../../common-components/entity-form/current-record-state";
import { EntityFieldEditComponent } from "./entity-field-edit.component";

describe("EntityFieldEditComponent", () => {
  let component: EntityFieldEditComponent;
  let fixture: ComponentFixture<EntityFieldEditComponent>;

  let mockFormService: any;
  let mockSchemaService: any;
  const mockField = { id: "testField" };

  beforeEach(() => {
    mockFormService = {
      extendFormFieldConfig: vi.fn(),
    };
    mockFormService.extendFormFieldConfig.mockReturnValue(mockField);

    mockSchemaService = {
      getComponent: vi.fn().mockReturnValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [EntityFieldEditComponent],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        { provide: EntitySchemaService, useValue: mockSchemaService },
        ComponentRegistry,
      ],
    });
    fixture = TestBed.createComponent(EntityFieldEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should use EntityFormService to extend field config", () => {
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());

    // Read the signal to trigger the lazy computation
    expect(component._field()).toEqual(mockField);
    expect(mockFormService.extendFormFieldConfig).toHaveBeenCalledWith(
      "testField",
      Entity,
    );
  });

  it("should silently hide if no entity with constructor is given", () => {
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", undefined);

    const result = component._field();
    expect(result).toBeDefined();
    expect(mockFormService.extendFormFieldConfig).not.toHaveBeenCalled();
  });

  it("should not modify the given field config while extending it without an entity", () => {
    mockSchemaService.getComponent.mockReturnValue("EditText");
    const fieldConfig = { id: "testField", displayFullLengthLabel: true };
    fixture.componentRef.setInput("field", fieldConfig);
    fixture.componentRef.setInput("entity", undefined);

    expect(component._field().editComponent).toBe("EditText");
    // the config object comes from the app config and must not be changed here
    expect(fieldConfig).toEqual({
      id: "testField",
      displayFullLengthLabel: true,
    });
  });

  it("should fall back to the read-only view if the form has no control for the field", () => {
    // e.g. after the entity schema was edited in the admin UI, a configured field
    // can be missing from the already-built formGroup
    mockFormService.extendFormFieldConfig.mockReturnValue({
      id: "testField",
      editComponent: "EditText",
    });
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("form", { formGroup: new FormGroup({}) });

    expect(component.formControl()).toBeNull();
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(
      fixture.nativeElement.querySelector("app-entity-field-view"),
    ).toBeTruthy();
  });

  it("should not fall back to the read-only view if the form has a control for the field", () => {
    mockFormService.extendFormFieldConfig.mockReturnValue({
      id: "testField",
      editComponent: "EditText",
    });
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("form", {
      formGroup: new FormGroup({ testField: new FormControl("") }),
    });

    expect(component.formControl()).toBeTruthy();
    // the edit branch is entered, so the read-only fallback is not rendered
    // (rendering the dynamic edit component itself is out of scope here)
    try {
      fixture.detectChanges();
    } catch {
      // dynamic edit component has its own dependencies, not provided in this test
    }
    expect(
      fixture.nativeElement.querySelector("app-entity-field-view"),
    ).toBeFalsy();
  });

  describe("current record state for the fields", () => {
    function collectStates() {
      const states: TestEntity[] = [];
      component
        .currentRecordState()
        .subscribe((s) => states.push(s as TestEntity));
      return states;
    }

    it("is provided to the field components", () => {
      expect(fixture.debugElement.injector.get(CurrentRecordContext)).toBe(
        component,
      );
    });

    it("combines the record with the current, possibly unsaved values of its form", async () => {
      const entity = TestEntity.create({ name: "Saved", other: "BERLIN" });
      const formGroup = new FormGroup({ other: new FormControl("BERLIN") });
      fixture.componentRef.setInput("entity", entity);
      fixture.componentRef.setInput("form", { formGroup } as any);
      const states = collectStates();
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(states.at(-1)?.other).toBe("BERLIN");
      });

      formGroup.get("other").setValue("HAMBURG");
      formGroup.get("other").disable(); // disabled fields still count, like for display conditions

      await vi.waitFor(() => expect(states.at(-1)?.other).toBe("HAMBURG"));
      expect(states.at(-1)?.name).toBe("Saved");
      expect(entity.other, "the saved record is not changed").toBe("BERLIN");
    });

    it("is the record itself if there is no form", async () => {
      const entity = TestEntity.create({ other: "BERLIN" });
      fixture.componentRef.setInput("entity", entity);
      const states = collectStates();

      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(states.at(-1)).toBe(entity);
      });
    });

    it("is empty if the field edits several records at once", async () => {
      fixture.componentRef.setInput(
        "entity",
        TestEntity.create({ other: "A" }),
      );
      fixture.componentRef.setInput("form", {
        formGroup: new FormGroup({ other: new FormControl("A") }),
      } as any);
      fixture.componentRef.setInput("forMultipleRecords", true);
      const states = collectStates();

      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(states).toHaveLength(1);
      });
      expect(states[0]).toBeUndefined();
    });
  });
});
