import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPublicFormRelatedEntitiesComponent } from "./edit-public-form-related-entities.component";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FormControl, ReactiveFormsModule, FormGroup } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditPublicFormRelatedEntitiesComponent", () => {
  let component: EditPublicFormRelatedEntitiesComponent;
  let fixture: ComponentFixture<EditPublicFormRelatedEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        EditPublicFormRelatedEntitiesComponent,
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicFormRelatedEntitiesComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    component.fieldIdControl = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
