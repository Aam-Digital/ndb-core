import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldSelectComponent } from "./entity-field-select.component";
import { EntityRegistry } from "../database-entity.decorator";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("EntityFieldSelectComponent", () => {
  let component: EntityFieldSelectComponent;
  let fixture: ComponentFixture<EntityFieldSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        EntityFieldSelectComponent,
        ReactiveFormsModule,
      ],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should merge the explicitly given options with the fields inferred from the entity schema", () => {
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("options", [
      { id: "name", label: "Custom Name" },
      { id: "distance", label: "Distance" },
    ]);
    fixture.detectChanges();

    component.autocompleteForm.setValue("");

    const offeredOptions = component.autocompleteOptions();
    const offeredIds = offeredOptions.map((o) => o.asValue);
    expect(offeredIds).toContain("distance");
    expect(offeredIds).toContain("other");
    // a field given both ways is offered once, with the explicit config winning
    expect(offeredIds.filter((id) => id === "name")).toEqual(["name"]);
    expect(offeredOptions.find((o) => o.asValue === "name").asString).toBe(
      "Custom Name",
    );
  });
});
