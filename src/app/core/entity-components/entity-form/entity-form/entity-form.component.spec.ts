import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { EntityFormModule } from "../entity-form.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form.service";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent<Child>;
  let fixture: ComponentFixture<EntityFormComponent<Child>>;

  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  const testChild = new Child();

  beforeEach(waitForAsync(() => {
    mockConfirmation = jasmine.createSpyObj(["getConfirmation"]);

    TestBed.configureTestingModule({
      imports: [
        EntityFormModule,
        MockedTestingModule.withState(),
        ReactiveFormsModule,
      ],
      providers: [
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testChild.name = "Test Name";
    fixture = TestBed.createComponent(EntityFormComponent<Child>);
    component = fixture.componentInstance;
    component.entity = testChild;
    component.columns = [[{ id: "name" }]];
    component.form = TestBed.inject(EntityFormService).createFormGroup(
      component.columns[0],
      component.entity
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should overwrite form if user confirms it", async () => {
    mockConfirmation.getConfirmation.and.resolveTo(true);
    component.form.get("name").setValue("Other Name");
    component.form.markAsDirty();
    testChild.name = "Changed Name";

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(testChild);

    expect(component.form.get("name")).toHaveValue("Changed Name");
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
  });

  it("should not overwrite form if user declines it", async () => {
    mockConfirmation.getConfirmation.and.resolveTo(false);
    component.form.get("name").setValue("Other Name");
    component.form.markAsDirty();
    testChild.name = "Changed Name";

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(testChild);

    expect(component.form.get("name")).toHaveValue("Other Name");
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
  });
});
