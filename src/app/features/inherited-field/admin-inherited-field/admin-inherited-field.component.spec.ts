import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { EntityRelationsService } from "../../../core/entity/entity-mapper/entity-relations.service";
import { AdminInheritedFieldComponent } from "./admin-inherited-field.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

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
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: EntityRelationsService,
          useValue: jasmine.createSpyObj(["getEntityTypesReferencingType"]),
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

  it("should create inherit options for entity reference fields with multiple additional types", () => {
    component.entityType = TestEntity;

    component.updateAvailableOptions();

    const relatedEntitiesOptions = component.availableOptions.filter(
      (option) => option.sourceReferenceField === "refMixed",
    );
    expect(relatedEntitiesOptions.length).toBeGreaterThan(1);
  });
});
