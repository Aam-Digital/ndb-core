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

import { AdminDefaultValueStaticComponent } from "./admin-default-value-static.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

describe("AdminDefaultValueStaticComponent", () => {
  let component: AdminDefaultValueStaticComponent;
  let fixture: ComponentFixture<AdminDefaultValueStaticComponent>;
  let mockEntityFormService: any;

  let testEntitySchemaField: EntitySchemaField;

  beforeEach(async () => {
    testEntitySchemaField = {
      dataType: "string",
    };

    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
    };
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueStaticComponent],
      providers: [
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: (v) => v,
            valueToDatabaseFormat: (v) => v,
            getComponent: () => null,
          },
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueStaticComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entitySchemaField", testEntitySchemaField);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
