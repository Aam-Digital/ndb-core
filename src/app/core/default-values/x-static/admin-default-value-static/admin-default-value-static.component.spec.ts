import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueStaticComponent } from "./admin-default-value-static.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";

describe("AdminDefaultValueStaticComponent", () => {
  let component: AdminDefaultValueStaticComponent;
  let fixture: ComponentFixture<AdminDefaultValueStaticComponent>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
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
            getComponent: () => null,
          },
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
