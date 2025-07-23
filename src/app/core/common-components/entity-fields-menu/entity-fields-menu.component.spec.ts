import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldsMenuComponent } from "./entity-fields-menu.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "../entity-form/entity-form.service";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("EntityFieldsMenuComponent", () => {
  let component: EntityFieldsMenuComponent;
  let fixture: ComponentFixture<EntityFieldsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityFieldsMenuComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityFormService, useValue: null },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should let a custom field override a default field", () => {
    component.availableFields = [
      "name",
      {
        id: "name",
        label: "Custom Name",
      },
      {
        id: "age",
        label: "Age",
      },
    ];
    expect(component._availableFields.length).toBe(2);

    const name = component._availableFields.find((f) => f.id === "name");
    expect(name.label).toBe("Custom Name");

    const age = component._availableFields.find((f) => f.id === "age");
    expect(age.label).toBe("Age");
  });
});
