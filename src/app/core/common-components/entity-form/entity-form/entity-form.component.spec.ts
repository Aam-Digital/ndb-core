import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form.service";
import { DateWithAge } from "../../../basic-datatypes/date-with-age/dateWithAge";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { MockDestroyRef } from "../../../../utils/mock-destroy-ref";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent<TestEntity>;
  let fixture: ComponentFixture<EntityFormComponent<TestEntity>>;

  let mockConfirmation: any;

  const testColumns = [
    [{ id: "name" }, { id: "other" }, { id: "photo" }, { id: "dateOfBirth" }],
  ];

  beforeEach(() => {
    mockConfirmation = {
      getConfirmation: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState(), EntityFormComponent],
      providers: [
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFormComponent<TestEntity>);
    component = fixture.componentInstance;

    setupInitialForm(new TestEntity(), testColumns);
  });

  async function setupInitialForm(entity, columns) {
    const form = await TestBed.inject(EntityFormService).createEntityForm(
      columns[0],
      entity,
      new MockDestroyRef(),
    );
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput(
      "fieldGroups",
      columns.map((c) => ({ fields: c })),
    );
    fixture.componentRef.setInput("form", form);
    fixture.detectChanges();
  }

  it("should remove fields without read permissions when entity is not new", async () => {
    const existingEntity = new TestEntity();
    existingEntity._rev = "foo";
    fixture.componentRef.setInput("entity", existingEntity);
    fixture.componentRef.setInput("fieldGroups", [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ]);

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "read",
        fields: ["foo", "name"],
      },
    ]);

    fixture.detectChanges();

    expect(component.filteredFieldGroups()).toEqual([
      { fields: ["foo"] },
      { fields: ["name"] },
    ]);
  });

  it("should remove fields without create permissions when entity is new", async () => {
    fixture.componentRef.setInput("fieldGroups", [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ]);

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "create",
        fields: ["foo", "name"],
      },
    ]);

    fixture.detectChanges();

    expect(component.filteredFieldGroups()).toEqual([
      { fields: ["foo"] },
      { fields: ["name"] },
    ]);
  });

  it("should hide a field whose displayCondition is not met", async () => {
    const entity = new TestEntity();
    entity.name = "irrelevant";
    const columns = [
      { id: "name" },
      { id: "other", displayCondition: { name: "shown" } },
    ];

    await setupInitialForm(entity, [columns]);

    expect(component.filteredFieldGroups()).toEqual([
      { fields: [{ id: "name" }] },
    ]);
    expect(component.form().formGroup.get("other").disabled).toBe(true);
  });

  it("should show and enable a field again once its displayCondition becomes met", async () => {
    const entity = new TestEntity();
    entity.name = "irrelevant";
    const columns = [
      { id: "name" },
      { id: "other", displayCondition: { name: "shown" } },
    ];

    await setupInitialForm(entity, [columns]);
    component.form().formGroup.get("name").setValue("shown");

    expect(component.filteredFieldGroups()).toEqual([{ fields: columns }]);
    expect(component.form().formGroup.get("other").disabled).toBe(false);
  });

  it("should hide the field again once its displayCondition becomes unmet", async () => {
    const entity = new TestEntity();
    entity.name = "shown";
    const columns = [
      { id: "name" },
      { id: "other", displayCondition: { name: "shown" } },
    ];

    await setupInitialForm(entity, [columns]);
    expect(component.filteredFieldGroups()).toEqual([{ fields: columns }]);

    component.form().formGroup.get("name").setValue("something else");

    expect(component.filteredFieldGroups()).toEqual([
      { fields: [{ id: "name" }] },
    ]);
    expect(component.form().formGroup.get("other").disabled).toBe(true);
  });

  it("should not force-enable a conditionally shown field while the rest of the form is still disabled (view mode)", async () => {
    // regression test: a field whose displayCondition is already met when the entity-details
    // "Form" panel is in read-only view mode (whole FormGroup disabled until "Edit" is clicked)
    // must stay disabled/read-only like its siblings, not become the only editable field
    const entity = new TestEntity();
    entity.name = "shown"; // condition already met from the start
    const columns = [
      { id: "name" },
      { id: "other", displayCondition: { name: "shown" } },
    ];

    await setupInitialForm(entity, [columns]);
    expect(component.form().formGroup.get("other").disabled).toBe(false);

    // simulates FormComponent's `form.formGroup.disable()` for a non-new entity (view mode)
    component.form().formGroup.disable();

    expect(component.form().formGroup.get("other").disabled).toBe(true);
    expect(component.form().formGroup.get("name").disabled).toBe(true);
  });

  it("should re-disable a still-hidden field and correctly enable a now-shown field once the form is enabled for editing", async () => {
    const entity = new TestEntity();
    entity.name = "irrelevant"; // condition not met
    const columns = [
      { id: "name" },
      { id: "other", displayCondition: { name: "shown" } },
    ];

    await setupInitialForm(entity, [columns]);
    component.form().formGroup.disable(); // view mode
    expect(component.form().formGroup.get("other").disabled).toBe(true);

    // simulates clicking "Edit": `(click)="form()?.formGroup.enable()"` in form.component.html
    component.form().formGroup.enable();

    // still hidden: enabling the whole group must not leave an unmet condition's field enabled
    expect(component.form().formGroup.get("other").disabled).toBe(true);

    component.form().formGroup.get("name").setValue("shown");
    // now shown: this component is the one that disabled it, so it may re-enable it
    expect(component.form().formGroup.get("other").disabled).toBe(false);
  });

  it("should not remove fields when creating new and conditions are not met yet", async () => {
    fixture.componentRef.setInput("fieldGroups", [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ]);

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "manage",
        fields: ["foo", "name"],
        conditions: { name: "x" },
      },
    ]);

    fixture.detectChanges();

    expect(component.filteredFieldGroups()).toEqual([
      { fields: ["foo"] },
      { fields: ["name"] },
    ]);
  });

  it("should not change anything if changed entity has same values as form", () => {
    return expectApplyChangesPopup(
      "not-shown",
      { _rev: "0" },
      { name: "updated" },
      { name: "updated", _rev: "1" },
      { name: "updated", _rev: "1" },
    );
  });

  it("should overwrite form if user confirms it", async () => {
    const formValues = { name: "other" };
    const remoteValues = { name: "changed" };
    await expectApplyChangesPopup(
      "yes",
      {},
      formValues,
      remoteValues,
      remoteValues,
    );
  });

  it("should not overwrite form if user declines it", async () => {
    const formValues = { name: "other" };
    const remoteValues = { name: "changed" };
    await expectApplyChangesPopup(
      "no",
      {},
      formValues,
      remoteValues,
      formValues,
    );
  });

  it("should overwrite without popup for changes affecting untouched fields", async () => {
    const originalEntity = { other: "p1" };
    const formValues = { other: "p2" };
    const remoteValues = {
      name: "changed",
      other: "p1",
      _rev: "new rev",
    };
    await expectApplyChangesPopup(
      "not-shown",
      originalEntity,
      formValues,
      remoteValues,
      {
        other: "p2",
        name: "changed",
        _rev: "new rev",
      },
    );
  });

  it("should clear field in form for properties removed in updated remote entity", async () => {
    const originalEntity = { other: "p1", name: "test" };
    const formValues = { other: "p2", name: "test" };
    const remoteValues = {
      _rev: "new rev",
    };
    await expectApplyChangesPopup(
      "no",
      originalEntity,
      formValues,
      remoteValues,
      {
        other: "p2",
        _rev: "new rev",
      },
    );
  });

  it("should not show popup if date was saved as day-only", async () => {
    const form = { dateOfBirth: new DateWithAge() };
    const dateOnly = new DateWithAge();
    dateOnly.setHours(0, 0, 0, 0);
    const remoteValues = { dateOfBirth: dateOnly };

    await expectApplyChangesPopup("not-shown", form, form, remoteValues, form);
  });

  async function expectApplyChangesPopup(
    popupAction: "not-shown" | "yes" | "no",
    originalEntity: Partial<TestEntity>,
    formChanges: Partial<TestEntity>,
    remoteChanges: Partial<TestEntity>,
    expectedFormValues: Partial<TestEntity>,
  ) {
    await setupInitialForm(
      Object.assign(new TestEntity(), originalEntity),
      testColumns,
    );

    mockConfirmation.getConfirmation.mockResolvedValue(popupAction === "yes");
    for (const c in formChanges) {
      component.form().formGroup.get(c).setValue(formChanges[c]);
      component.form().formGroup.get(c).markAsDirty();
    }
    const updatedChild = new TestEntity(component.entity().getId());
    Object.assign(updatedChild, remoteChanges);

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(updatedChild);

    const entityAfterSave = Object.assign(
      {},
      component.entity(),
      component.form().formGroup.getRawValue(),
    );
    for (const [key, value] of Object.entries(expectedFormValues)) {
      const form = component.form().formGroup.get(key);
      if (form) {
        expect(form.value).toEqual(value);
      }
      expect(entityAfterSave[key]).toEqual(value);
    }
    expect(
      vi.mocked(mockConfirmation.getConfirmation).mock.calls.length > 0,
    ).toBe(popupAction !== "not-shown");
  }
});
