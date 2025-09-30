import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPublicFormRelatedEntitiesComponent } from "./edit-public-form-related-entities.component";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { setupCustomFormControlEditComponent } from "app/core/entity/default-datatype/edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

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
