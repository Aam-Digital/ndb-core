import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormBuilder,
} from "@angular/forms";

import { EditMatchingViewComponent } from "./edit-matching-view.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";

describe("EditMatchingViewComponent", () => {
  let component: EditMatchingViewComponent;
  let fixture: ComponentFixture<EditMatchingViewComponent>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
      "extendFormFieldConfig",
    ]);
    await TestBed.configureTestingModule({
      imports: [
        EditMatchingViewComponent,
        ReactiveFormsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        FormBuilder,
        EntityRegistry,
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMatchingViewComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      newEntityType: new FormControl(""),
      newEntityMatchPropertyLeft: new FormControl(""),
      newEntityMatchPropertyRight: new FormControl(""),
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
