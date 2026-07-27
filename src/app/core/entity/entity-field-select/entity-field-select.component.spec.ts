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

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should offer the explicitly given options, including fields that are not part of the entity schema", () => {
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("options", [
      { id: "name", label: "Name" },
      { id: "distance", label: "Distance" },
    ]);
    fixture.detectChanges();

    component.autocompleteForm.setValue("");

    expect(component.autocompleteOptions().map((o) => o.asValue)).toEqual([
      "name",
      "distance",
    ]);
  });
});
