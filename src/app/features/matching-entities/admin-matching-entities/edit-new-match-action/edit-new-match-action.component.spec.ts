/*
 * Kept for its setup, not its assertion.
 *
 * This component needs real providers or inputs to be constructed at all, so it cannot join
 * the sweep in `src/app/component-smoke.spec.ts`, and working out what it depends on is the
 * expensive part of writing a test for it. The construction check below is a placeholder:
 * the component has enough logic to deserve real assertions, so add them here rather than
 * starting a new file.
 */
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";

import { EditNewMatchActionComponent } from "./edit-new-match-action.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";

describe("EditNewMatchActionComponent", () => {
  let component: EditNewMatchActionComponent;
  let fixture: ComponentFixture<EditNewMatchActionComponent>;
  let mockEntityRelationsService: any;
  let mockEntityFormService: any;

  beforeEach(async () => {
    mockEntityRelationsService = {
      getEntityTypesReferencingType: vi
        .fn()
        .mockName("EntityRelationsService.getEntityTypesReferencingType"),
    };
    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };
    await TestBed.configureTestingModule({
      imports: [
        EditNewMatchActionComponent,
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

    fixture = TestBed.createComponent(EditNewMatchActionComponent);
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
