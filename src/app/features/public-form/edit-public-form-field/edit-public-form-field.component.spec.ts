import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPublicFormFieldComponent } from "./edit-public-form-field.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AdminEntityComponent } from "app/core/admin/admin-entity/admin-entity.component";
import { AdminEntityDetailsComponent } from "app/core/admin/admin-entity-details/admin-entity-details/admin-entity-details.component";
import { RouterLink } from "@angular/router";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Database } from "app/core/database/database";

fdescribe("EditPublicFormFieldComponent", () => {
  let component: EditPublicFormFieldComponent;
  let fixture: ComponentFixture<EditPublicFormFieldComponent>;

  // Mock EntityRegistry, EntityFormService, EntityMapperService, and Database
  const mockEntityRegistry = {
    get: jasmine.createSpy("get").and.returnValue({}),
  };

  const mockEntityFormService = {};
  const mockEntityMapperService = {};
  const mockDatabaseService = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditPublicFormFieldComponent,
        AdminEntityComponent,
        AdminEntityDetailsComponent,
        FontAwesomeModule,
        RouterLink,
        AdminEntityFormComponent,
      ],
      providers: [
        { provide: EntityRegistry, useValue: mockEntityRegistry }, // Mock the EntityRegistry
        { provide: EntityFormService, useValue: mockEntityFormService }, // Mock the EntityFormService
        { provide: EntityMapperService, useValue: mockEntityMapperService }, // Mock the EntityMapperService
        { provide: Database, useValue: mockDatabaseService }, // Mock the Database service
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicFormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
