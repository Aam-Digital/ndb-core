/*
 * Kept for its setup, not its assertion.
 *
 * This component needs real providers or inputs to be constructed at all, so it cannot join
 * the sweep in `src/app/component-smoke.spec.ts`, and working out what it depends on is the
 * expensive part of writing a test for it. The construction check below is a placeholder:
 * the component has enough logic to deserve real assertions, so add them here rather than
 * starting a new file.
 */
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConditionalColorSectionComponent } from "./conditional-color-section.component";
import { ColorMapping } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ComponentRegistry } from "#src/app/dynamic-components";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("ConditionalColorSectionComponent", () => {
  let component: ConditionalColorSectionComponent;
  let fixture: ComponentFixture<ConditionalColorSectionComponent>;

  const mockColorFieldOptions: SimpleDropdownValue[] = [
    { value: "status", label: "Status" },
    { value: "name", label: "Name" },
  ];

  const mockSection: ColorMapping = {
    condition: { $or: [{ status: "active" }] },
    color: "#FF0000",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionalColorSectionComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: ComponentRegistry,
          useValue: {},
        },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalColorSectionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("section", mockSection);
    fixture.componentRef.setInput("entityConstructor", TestEntity);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
