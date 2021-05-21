import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { EntityFormModule } from "../../entity-form.module";
import { FormControl } from "@angular/forms";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { EntityFormService } from "../../entity-form.service";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditSingleEntityComponent", () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [EntityFormModule, NoopAnimationsModule],
      declarations: [EditSingleEntityComponent],
      providers: [
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSingleEntityComponent);
    component = fixture.componentInstance;
    const entityFormService = TestBed.inject(EntityFormService);
    component.formControl = entityFormService
      .createFormGroup([{ id: "name" }], new Child())
      .get("name") as FormControl;
    component.formControlName = "name";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
