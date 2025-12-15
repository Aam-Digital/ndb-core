import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityRelationsService } from "../../../core/entity/entity-mapper/entity-relations.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { AdminInheritedFieldComponent } from "./admin-inherited-field.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("AdminInheritedFieldComponent", () => {
  let component: AdminInheritedFieldComponent;
  let fixture: ComponentFixture<AdminInheritedFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminInheritedFieldComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialog, useValue: jasmine.createSpyObj(["open"]) },
        { provide: EntityRegistry, useValue: new Map() },
        {
          provide: EntityRelationsService,
          useValue: jasmine.createSpyObj(["getEntityTypesReferencingType"]),
        },
        {
          provide: EntitySchemaService,
          useValue: jasmine.createSpyObj(["valueToEntityFormat"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminInheritedFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
