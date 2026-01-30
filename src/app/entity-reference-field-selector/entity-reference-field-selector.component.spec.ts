import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SimpleChange } from "@angular/core";

import { EntityReferenceFieldSelectorComponent } from "./entity-reference-field-selector.component";
import { MockedTestingModule } from "../utils/mocked-testing.module";

describe("EntityReferenceFieldSelectorComponent", () => {
  let component: EntityReferenceFieldSelectorComponent;
  let fixture: ComponentFixture<EntityReferenceFieldSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityReferenceFieldSelectorComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityReferenceFieldSelectorComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit optionSelected and update selectedOption", () => {
    const option = {
      type: "inherit" as const,
      label: "Test Option",
      labelParts: { entityName: "Entity", fieldName: "Field" },
      tooltip: "Test tooltip",
      sourceReferenceField: "testField",
    };

    spyOn(component.optionSelected, "emit");

    component.onOptionSelected({ value: option });

    expect(component.selectedOption).toBe(option);
    expect(component.optionSelected.emit).toHaveBeenCalledWith(option);
  });

  it("should set selectedOption to null when value is not provided", () => {
    component.value = null;
    component.availableOptions = [];

    component.ngOnChanges({
      entityType: new SimpleChange(null, { ENTITY_TYPE: "Test" }, true),
    });

    expect(component.selectedOption).toBeNull();
  });

  it("should call updateAvailableOptions when entityType changes", () => {
    spyOn(component, "updateAvailableOptions");

    component.ngOnChanges({
      entityType: new SimpleChange(null, { ENTITY_TYPE: "Test" }, true),
    });

    expect(component.updateAvailableOptions).toHaveBeenCalled();
  });
});
