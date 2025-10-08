import { ComponentFixture, TestBed } from "@angular/core/testing";

import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { EditPublicFormRelatedEntitiesComponent } from "./edit-public-form-related-entities.component";

describe("EditPublicFormRelatedEntitiesComponent", () => {
  let component: EditPublicFormRelatedEntitiesComponent;
  let fixture: ComponentFixture<EditPublicFormRelatedEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        EditPublicFormRelatedEntitiesComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicFormRelatedEntitiesComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
