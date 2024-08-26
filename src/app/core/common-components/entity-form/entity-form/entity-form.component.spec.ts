import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

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

  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  const testColumns = [
    [{ id: "name" }, { id: "other" }, { id: "photo" }, { id: "dateOfBirth" }],
  ];

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
    fixture = TestBed.createComponent(EntityFormComponent<TestEntity>);
    component = fixture.componentInstance;

    setupInitialForm(new TestEntity(), testColumns);
  });

  function setupInitialForm(entity, columns) {
    component.entity = entity;
    component.fieldGroups = columns.map((c) => ({ fields: c }));
    component.form = TestBed.inject(EntityFormService).createFormGroup(
      columns[0],
      component.entity,
    );
    component.ngOnChanges({ entity: true, form: true } as any);
    fixture.detectChanges();
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should remove fields without read permissions when entity is not new", async () => {
    component.fieldGroups = [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ];

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "read",
        fields: ["foo", "name"],
      },
    ]);

    component.entity._rev = "foo";

    component.ngOnChanges({ entity: true, form: true } as any);

    expect(component.fieldGroups).toEqual([
      { fields: ["foo"] },
      { fields: ["name"] },
    ]);
  });

  it("should remove fields without create permissions when entity is new", async () => {
    component.fieldGroups = [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ];

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "create",
        fields: ["foo", "name"],
      },
    ]);

    component.ngOnChanges({ entity: true, form: true } as any);

    expect(component.fieldGroups).toEqual([
      { fields: ["foo"] },
      { fields: ["name"] },
    ]);
  });

  it("should not remove fields when creating new and conditions are not met yet", async () => {
    component.fieldGroups = [
      { fields: ["foo", "bar"] },
      { fields: ["name"] },
      { fields: ["birthday"] },
    ];

    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "manage",
        fields: ["foo", "name"],
        conditions: { name: "x" },
      },
    ]);

    component.ngOnChanges({ entity: true, form: true } as any);

    expect(component.fieldGroups).toEqual([
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
    setupInitialForm(
      Object.assign(new TestEntity(), originalEntity),
      testColumns,
    );

    mockConfirmation.getConfirmation.and.resolveTo(popupAction === "yes");
    for (const c in formChanges) {
      component.form.get(c).setValue(formChanges[c]);
      component.form.get(c).markAsDirty();
    }
    const updatedChild = new TestEntity(component.entity.getId());
    Object.assign(updatedChild, remoteChanges);

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(updatedChild);

    const entityAfterSave = Object.assign(
      {},
      component.entity,
      component.form.getRawValue(),
    );
    for (const [key, value] of Object.entries(expectedFormValues)) {
      const form = component.form.get(key);
      if (form) {
        expect(form).toHaveValue(value);
      }
      expect(entityAfterSave[key]).toEqual(value);
    }
    expect(mockConfirmation.getConfirmation.calls.any()).toBe(
      popupAction !== "not-shown",
    );
  }
});
