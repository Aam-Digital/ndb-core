import { TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  AffectedEntity,
  AutomatedFieldUpdateComponent,
} from "./automated-field-update.component";

describe("AutomatedFieldUpdateComponent", () => {
  let component: AutomatedFieldUpdateComponent;
  let loadNextLevel: ReturnType<typeof vi.fn>;
  let createEntityForm: ReturnType<typeof vi.fn>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const FIRST = "Entity:first";
  const SECOND = "Entity:second";

  function affected(
    id: string,
    newValue: string[],
    level: number,
  ): AffectedEntity {
    return {
      id,
      newValue: newValue as any,
      targetFieldId: "tags",
      targetEntityType: Entity,
      affectedEntity: new Entity(id.split(":")[1]),
      relatedReferenceField: "parent",
      level,
      via: [level === 1 ? "Entity:trigger" : FIRST],
    };
  }

  /** The entity above the first one is suggested the value of the first one, if that is not "none" */
  function suggestAbove(source: AffectedEntity): Promise<AffectedEntity[]> {
    const suggestion = source.id === FIRST && source.newValue[0] !== "none";
    return Promise.resolve(
      suggestion ? [affected(SECOND, source.newValue as any, 2)] : [],
    );
  }

  function valueOf(row: AffectedEntity) {
    return row.form.formGroup.controls[row.targetFieldId].value;
  }

  function edit(row: AffectedEntity, value: string[]) {
    const control = row.form.formGroup.controls[row.targetFieldId];
    control.setValue(value);
    control.markAsDirty();
  }

  async function initDialog(entities: AffectedEntity[]) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entities,
            trigger: {
              entity: new Entity("trigger"),
              before: new Entity("trigger"),
            },
            loadNextLevel,
          },
        },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: EntityFormService,
          useValue: {
            extendFormFieldConfig: (id: string) => ({ id }),
            createEntityForm,
          },
        },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: (value: any) => value,
            valueToDatabaseFormat: (value: any) => value,
          },
        },
      ],
    });
    TestBed.overrideComponent(AutomatedFieldUpdateComponent, {
      set: { imports: [], template: "" },
    });
    component = TestBed.createComponent(
      AutomatedFieldUpdateComponent,
    ).componentInstance;
    await component.ngOnInit();
  }

  /** Wait until the suggestions of the entities above are updated after a change */
  async function waitForUpdate() {
    await vi.advanceTimersByTimeAsync(1000);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    loadNextLevel = vi.fn(suggestAbove);
    createEntityForm = vi.fn((fieldIds: string[]) =>
      Promise.resolve({
        formGroup: new FormGroup({ [fieldIds[0]]: new FormControl() }),
      }),
    );
    dialogRef = { close: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should suggest the entities above again based on the value that the user entered", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    const [first, second] = component.rows();

    edit(first, ["x"]);
    expect(component.recalculating()).toBe(true);
    await waitForUpdate();

    expect(loadNextLevel).toHaveBeenCalledWith(
      expect.objectContaining({ id: FIRST, newValue: ["x"] }),
      [expect.objectContaining({ id: FIRST, newValue: ["x"] })],
    );
    expect(component.rows()).toEqual([first, second]);
    expect(valueOf(second)).toEqual(["x"]);
    expect(second.edited).toBeFalsy();
    expect(component.recalculating()).toBe(false);
  });

  it("should show an entity above that is only affected after a change and remove it when not affected any more", async () => {
    await initDialog([affected(FIRST, ["none"], 1)]);
    const [first] = component.rows();
    expect(component.rows()).toHaveLength(1);

    edit(first, ["x"]);
    await waitForUpdate();
    expect(component.rows().map((row) => row.id)).toEqual([FIRST, SECOND]);
    const second = component.rows()[1];
    expect(valueOf(second)).toEqual(["x"]);
    expect(second.level).toBe(2);

    edit(first, ["none"]);
    await waitForUpdate();
    expect(component.rows().map((row) => row.id)).toEqual([FIRST]);
  });

  it("should keep the value the user entered for an entity above and offer the new suggestion", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    const [first, second] = component.rows();

    edit(second, ["mine"]);
    await waitForUpdate();
    expect(second.edited).toBe(true);
    expect(second.suggestionChanged).toBeFalsy();

    edit(first, ["y"]);
    await waitForUpdate();
    expect(valueOf(second)).toEqual(["mine"]);
    expect(second.newValue).toEqual(["y"]);
    expect(second.suggestionChanged).toBe(true);

    component.useSuggestion(second);
    await waitForUpdate();
    expect(valueOf(second)).toEqual(["y"]);
    expect(second.edited).toBe(false);
    expect(second.suggestionChanged).toBe(false);
  });

  it("should try again on the next change if updating the suggestions above failed", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    const [first, second] = component.rows();
    loadNextLevel.mockRejectedValueOnce(new Error("could not load"));

    edit(first, ["x"]);
    await waitForUpdate();
    // saving stays disabled, as the entities above may not match the entered value
    expect(component.recalculating()).toBe(true);
    expect(component.recalculationFailed()).toBe(true);

    edit(first, ["y"]);
    await waitForUpdate();

    expect(valueOf(second)).toEqual(["y"]);
    expect(component.recalculating()).toBe(false);
    expect(component.recalculationFailed()).toBe(false);
  });

  it("should create the forms without default value handling, which only queries linked records for the hidden inherit button", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);

    expect(createEntityForm).toHaveBeenCalledTimes(2);
    for (const call of createEntityForm.mock.calls) {
      // forTable, withPermissionCheck, withDefaultValues
      expect(call.slice(3)).toEqual([false, true, false]);
    }
  });

  it("should not count the suggested value as a change of the user", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    const [, second] = component.rows();

    edit(second, ["mine"]);
    edit(second, ["a"]);
    await waitForUpdate();

    expect(second.edited).toBe(false);
  });

  it("should return the shown entities with the values of the form on confirm", async () => {
    await initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    const [first] = component.rows();
    edit(first, ["x"]);
    await waitForUpdate();

    component.onConfirm();

    expect(dialogRef.close).toHaveBeenCalledWith([
      expect.objectContaining({ id: FIRST, newValue: ["x"] }),
      expect.objectContaining({ id: SECOND, newValue: ["x"] }),
    ]);
  });
});
