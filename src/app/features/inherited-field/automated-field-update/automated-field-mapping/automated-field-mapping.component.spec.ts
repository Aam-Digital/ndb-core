import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AutomatedFieldMappingComponent } from "./automated-field-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";

describe("AutomatedFieldMappingComponent", () => {
  let component: AutomatedFieldMappingComponent;
  let fixture: ComponentFixture<AutomatedFieldMappingComponent>;

  const mockDialogData = {
    currentEntityType: class MockEntity extends Object {},
    relatedEntityType: class MockRefEntity extends Object {},
    currentField: "status",
    relatedReferenceFields: "remarks",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedFieldMappingComponent, FontAwesomeTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        {
          provide: EntityFormService,
          useValue: jasmine.createSpyObj([
            "createEntityForm",
            "extendFormFieldConfig",
          ]),
        },
        {
          provide: EntityRegistry,
          useValue: { get: () => ({ schema: new Map() }) },
        },
        {
          provide: ConfigurableEnumService,
          useValue: jasmine.createSpyObj(["getEnum"]),
        },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: (v) => v,
            valueToDatabaseFormat: (v) => v,
          },
        },
        SyncStateSubject,
        CurrentUserSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutomatedFieldMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
