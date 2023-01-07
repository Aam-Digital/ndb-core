import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form.service";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent<Child>;
  let fixture: ComponentFixture<EntityFormComponent<Child>>;

  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(waitForAsync(() => {
    mockConfirmation = jasmine.createSpyObj(["getConfirmation"]);
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState(), EntityFormComponent],
      providers: [
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityFormComponent<Child>);
    component = fixture.componentInstance;
    component.entity = new Child();
    component.columns = [
      [{ id: "name" }, { id: "projectNumber" }, { id: "photo" }],
    ];
    component.form = TestBed.inject(EntityFormService).createFormGroup(
      component.columns[0],
      component.entity
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not change anything if changed entity has same values as form", () => {
    return expectApplyChangesPopup(
      "not-shown",
      { name: "updated" },
      { name: "updated" },
      { name: "updated" }
    );
  });

  it("should overwrite form if user confirms it", async () => {
    const formValues = { name: "other" };
    const remoteValues = { name: "changed" };
    await expectApplyChangesPopup(
      "yes",
      formValues,
      remoteValues,
      remoteValues
    );
  });

  it("should not overwrite form if user declines it", async () => {
    const formValues = { name: "other" };
    const remoteValues = { name: "changed" };
    await expectApplyChangesPopup("no", formValues, remoteValues, formValues);
  });

  it("should overwrite without popup for changes affecting untouched fields", async () => {
    const formValues = { projectNumber: "other" };
    const remoteValues = { name: "changed", _rev: "new rev" };
    await expectApplyChangesPopup("not-shown", formValues, remoteValues, {
      projectNumber: "other",
      name: "changed",
      _rev: "new rev",
    });
  });

  async function expectApplyChangesPopup(
    popupAction: "not-shown" | "yes" | "no",
    formChanges: Partial<Child>,
    remoteChanges: Partial<Child>,
    expectedFormValues: Partial<Child>
  ) {
    mockConfirmation.getConfirmation.and.resolveTo(popupAction === "yes");
    for (const c in formChanges) {
      component.form.get(c).setValue(formChanges[c]);
      component.form.get(c).markAsDirty();
    }
    const updatedChild = new Child(component.entity.getId());
    for (const c in remoteChanges) {
      updatedChild[c] = remoteChanges[c];
    }

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(updatedChild);

    for (const v in expectedFormValues) {
      const form = component.form.get(v);
      if (form) {
        expect(form).toHaveValue(expectedFormValues[v]);
      }
    }
    expect(mockConfirmation.getConfirmation.calls.any()).toBe(
      popupAction !== "not-shown"
    );
  }
});
