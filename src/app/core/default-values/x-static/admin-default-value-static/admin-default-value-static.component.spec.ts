import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueStaticComponent } from "./admin-default-value-static.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

describe("AdminDefaultValueStaticComponent", () => {
  let component: AdminDefaultValueStaticComponent;
  let fixture: ComponentFixture<AdminDefaultValueStaticComponent>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  let testEntitySchemaField: EntitySchemaField;

  beforeEach(async () => {
    testEntitySchemaField = {
      dataType: "string",
    };

    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);
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

    component.entitySchemaField = testEntitySchemaField;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
