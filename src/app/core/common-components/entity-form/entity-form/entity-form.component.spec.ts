import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form.service";
import { DateWithAge } from "../../../basic-datatypes/date-with-age/dateWithAge";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

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
    );
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput(
      "fieldGroups",
      columns.map((c) => ({ fields: c })),
    );
    fixture.componentRef.setInput("form", form);
    fixture.detectChanges();
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

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
