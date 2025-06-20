import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditRelatedEntitiesComponent } from "./edit-related-entities.component";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FormControl, ReactiveFormsModule, FormGroup } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditRelatedEntitiesComponent", () => {
  let component: EditRelatedEntitiesComponent;
  let fixture: ComponentFixture<EditRelatedEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        EditRelatedEntitiesComponent,
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRelatedEntitiesComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    component.form = new FormGroup({
      id: new FormControl(null),
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
