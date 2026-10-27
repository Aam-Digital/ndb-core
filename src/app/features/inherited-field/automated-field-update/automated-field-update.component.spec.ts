import { TestBed } from "@angular/core/testing";
import { isEqual } from "lodash-es";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { AutomatedFieldUpdateComponent } from "./automated-field-update.component";
import {
  AffectedEntity,
  EnteredValue,
  UpdateTrigger,
} from "./automated-field-update.types";

/** The fields of the changed entity and the ids of the rows of each group, to compare them */
function summarizeGroups(
  groups: ReturnType<AutomatedFieldUpdateComponent["groups"]>,
) {
  return groups.map((group) => ({
    fields: group.triggers[0].changes.map((change) => change.field.id),
    rows: group.rows.map((row) => row.id),
  }));
}

/** Values like the options of an enum are stored by their id */
function toId(value: unknown): unknown {
  return value && typeof value === "object" && "id" in value ? value.id : value;
}

describe("AutomatedFieldUpdateComponent", () => {
  let component: AutomatedFieldUpdateComponent;
  let recalculate: ReturnType<typeof vi.fn>;
  let fieldConfigs: Record<string, FormFieldConfig>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const FIRST = "Entity:first";
  const SECOND = "Entity:second";
  const SAVED = ["saved"];

  function affected(
    id: string,
    newValue: unknown[],
    level: number,
  ): AffectedEntity {
    return {
      id,
      newValue,
      savedValue: SAVED,
      sourceFieldId: "source",
      targetFieldId: "tags",
      targetEntityType: Entity,
      affectedEntity: new Entity(id.split(":")[1]),
      relatedReferenceField: "parent",
      level,
      via: [level === 1 ? "Entity:trigger" : FIRST],
    };
  }

  /**
   * The first entity keeps its suggestion, the entity above it is suggested the value of the first one
   * (entered by the user or suggested), if that is not "none"
   */
  function suggestAbove(
    enteredValues: EnteredValue[],
  ): Promise<AffectedEntity[]> {
    const first = component.data.entities[0];
    const firstValue =
      enteredValues.find((entered) => entered.id === FIRST)?.value ??
      first.newValue;
    return Promise.resolve([
      affected(FIRST, first.newValue as unknown[], 1),
      ...(isEqual(firstValue, ["none"])
        ? []
        : [affected(SECOND, firstValue as unknown[], 2)]),
    ]);
  }

  function row(id: string) {
    return component.rows().find((r) => r.id === id);
  }

  function edit(id: string, value: unknown[]) {
    component.onValueChange(row(id), value);
  }

  function initDialog(
    entities: AffectedEntity[],
    triggers: UpdateTrigger[] = [
      { entity: new Entity("trigger"), before: new Entity("trigger") },
    ],
  ) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entities,
            triggers,
            recalculate,
          },
        },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: EntityFormService,
          useValue: {
            extendFormFieldConfig: (id: string) => fieldConfigs[id] ?? { id },
          },
        },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: (value: unknown) => value,
            valueToDatabaseFormat: (value: unknown) =>
              Array.isArray(value) ? value.map(toId) : toId(value),
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
  }

  /** Wait until the suggestions of the entities above are updated after a change */
  async function waitForUpdate() {
    await vi.advanceTimersByTimeAsync(1000);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    recalculate = vi.fn(suggestAbove);
    fieldConfigs = {};
    dialogRef = { close: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should suggest the entities above again based on the value that the user entered", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);

    edit(FIRST, ["x"]);
    expect(component.recalculating()).toBe(true);
    await waitForUpdate();

    expect(recalculate).toHaveBeenCalledWith([
      { id: FIRST, targetFieldId: "tags", value: ["x"] },
    ]);
    expect(component.rows().map((r) => [r.id, r.value])).toEqual([
      [FIRST, ["x"]],
      [SECOND, ["x"]],
    ]);
    expect(row(SECOND).edited).toBe(false);
    expect(component.recalculating()).toBe(false);
  });

  it("should show an entity above that is only affected after a change and remove it when not affected any more", async () => {
    initDialog([affected(FIRST, ["none"], 1)]);
    expect(component.rows()).toHaveLength(1);

    edit(FIRST, ["x"]);
    await waitForUpdate();
    expect(component.rows().map((r) => r.id)).toEqual([FIRST, SECOND]);
    expect(row(SECOND).value).toEqual(["x"]);
    expect(row(SECOND).level).toBe(2);

    edit(FIRST, ["none"]);
    await waitForUpdate();
    expect(component.rows().map((r) => r.id)).toEqual([FIRST]);
  });

  it("should keep the value the user entered for an entity above and offer the new suggestion", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);

    edit(SECOND, ["mine"]);
    await waitForUpdate();
    expect(row(SECOND).edited).toBe(true);
    expect(row(SECOND).suggestionChanged).toBe(false);

    edit(FIRST, ["y"]);
    await waitForUpdate();
    expect(row(SECOND).value).toEqual(["mine"]);
    expect(row(SECOND).newValue).toEqual(["y"]);
    expect(row(SECOND).suggestionChanged).toBe(true);

    component.useSuggestion(row(SECOND));
    await waitForUpdate();
    expect(row(SECOND).value).toEqual(["y"]);
    expect(row(SECOND).edited).toBe(false);
    expect(row(SECOND).suggestionChanged).toBe(false);
  });

  it("should keep the value the user entered for an entity above that is not suggested any more", async () => {
    initDialog([
      affected(FIRST, ["a"], 1),
      { ...affected(SECOND, ["a"], 2), noCommonValue: "conflict" },
    ]);
    edit(SECOND, ["mine"]);
    await waitForUpdate();

    edit(FIRST, ["none"]);
    await waitForUpdate();

    expect(component.rows().map((r) => [r.id, r.value])).toEqual([
      [FIRST, ["none"]],
      [SECOND, ["mine"]],
    ]);
    // the suggestion for it is to keep its saved value
    expect(row(SECOND).newValue).toEqual(SAVED);
    expect(row(SECOND).suggestionChanged).toBe(true);
    // the hints of the earlier suggestion do not apply any more
    expect(row(SECOND).noCommonValue).toBeUndefined();
  });

  it("should try again on the next change if updating the suggestions above failed", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    recalculate.mockRejectedValueOnce(new Error("could not load"));

    edit(FIRST, ["x"]);
    await waitForUpdate();
    // saving stays disabled, as the entities above may not match the entered value
    expect(component.recalculating()).toBe(true);
    expect(component.recalculationFailed()).toBe(true);

    edit(FIRST, ["y"]);
    await waitForUpdate();

    expect(row(SECOND).value).toEqual(["y"]);
    expect(component.recalculating()).toBe(false);
    expect(component.recalculationFailed()).toBe(false);
  });

  it("should clear the failure hint once a later update succeeds, also if it was started with the suggestion", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    edit(SECOND, ["mine"]);
    await waitForUpdate();
    edit(FIRST, ["y"]);
    await waitForUpdate();
    expect(row(SECOND).suggestionChanged).toBe(true);
    recalculate.mockRejectedValueOnce(new Error("could not load"));
    edit(FIRST, ["z"]);
    await waitForUpdate();
    expect(component.recalculationFailed()).toBe(true);

    component.useSuggestion(row(SECOND));
    await waitForUpdate();

    expect(component.recalculationFailed()).toBe(false);
    expect(component.recalculating()).toBe(false);
  });

  it("should not keep a value the user changed back to the suggestion", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);

    edit(SECOND, ["mine"]);
    edit(SECOND, ["a"]);
    await waitForUpdate();

    expect(row(SECOND).edited).toBe(false);
  });

  it("should return the shown entities with the shown values on confirm", async () => {
    initDialog([affected(FIRST, ["a"], 1), affected(SECOND, ["a"], 2)]);
    edit(FIRST, ["x"]);
    await waitForUpdate();

    component.onConfirm();

    expect(dialogRef.close).toHaveBeenCalledWith([
      expect.objectContaining({ id: FIRST, newValue: ["x"] }),
      expect.objectContaining({ id: SECOND, newValue: ["x"] }),
    ]);
  });

  it.each([
    [
      "the same field",
      [affected(FIRST, ["a"], 1), affected("Entity:other", ["a"], 1)],
      true,
    ],
    [
      "different fields",
      [
        affected(FIRST, ["a"], 1),
        { ...affected("Entity:other", ["a"], 1), relatedReferenceField: "x" },
      ],
      false,
    ],
    [
      "the same field, even if the entities above are linked through another one",
      [
        affected(FIRST, ["a"], 1),
        { ...affected(SECOND, ["a"], 2), relatedReferenceField: "x" },
      ],
      true,
    ],
  ])(
    "should tell whether the directly linked entities are all linked through the same field: %s",
    (_, entities, expected) => {
      initDialog(entities);

      expect(component.allLinkedThroughSameField).toBe(expected);
    },
  );

  describe("grouping by the field of the changed entity", () => {
    function basedOn(row: AffectedEntity, sourceFieldId: string) {
      return { ...row, sourceFieldId };
    }

    it("should list the entities above in the group of the field that their update is based on", () => {
      const other = "Entity:other";
      initDialog([
        basedOn(affected(FIRST, ["a"], 1), "center"),
        basedOn(affected(other, ["m"], 1), "gender"),
        // passes on the value of the first one, so it is based on the same field of the changed entity
        basedOn(affected(SECOND, ["a"], 2), "center"),
      ]);

      expect(summarizeGroups(component.groups())).toEqual([
        { fields: ["center"], rows: [FIRST, SECOND] },
        { fields: ["gender"], rows: [other] },
      ]);
    });

    it("should have one group if all entities are based on the same field", () => {
      initDialog([
        basedOn(affected(FIRST, ["a"], 1), "center"),
        basedOn(affected("Entity:other", ["a"], 1), "center"),
      ]);

      expect(component.groups()).toHaveLength(1);
    });

    it("should add the group of an entity that is only affected after a change", async () => {
      initDialog([basedOn(affected(FIRST, ["none"], 1), "center")]);
      recalculate.mockImplementation(([entered]: EnteredValue[]) =>
        Promise.resolve([
          basedOn(affected(FIRST, ["none"], 1), "center"),
          basedOn(affected(SECOND, entered.value as unknown[], 2), "center"),
        ]),
      );

      edit(FIRST, ["x"]);
      await waitForUpdate();

      expect(component.groups()).toHaveLength(1);
      expect(component.groups()[0].rows.map((r) => r.id)).toEqual([
        FIRST,
        SECOND,
      ]);
    });
  });

  describe("removed and added values of the changed entity", () => {
    const A = { id: "a", label: "A" };
    const B = { id: "b", label: "B" };
    const C = { id: "c", label: "C" };

    /** a change of the center of a record (in entity format) */
    function centerChange(id: string, before: unknown, after: unknown) {
      const trigger = { entity: new Entity(id), before: new Entity(id) };
      Object.assign(trigger.before, { center: before });
      Object.assign(trigger.entity, { center: after });
      return trigger;
    }

    function change(before: unknown, after: unknown, isArray: boolean) {
      fieldConfigs["center"] = { id: "center", isArray };
      initDialog(
        [{ ...affected(FIRST, ["a"], 1), sourceFieldId: "center" }],
        [centerChange("trigger", before, after)],
      );
      const { isChanged, removed, added } =
        component.groups()[0].triggers[0].changes[0];
      return {
        isChanged,
        removed: removed?.["center"],
        added: added?.["center"],
      };
    }

    // the values are shown from their database format (the ids of the options)
    it.each([
      ["a value of a list", true, [A, B], [B, C], ["a"], ["c"]],
      [
        "a value that only has another label, as the same one",
        true,
        [A],
        [{ id: "a", label: "A (renamed)" }],
        undefined,
        undefined,
      ],
      ["all values of a list", true, [A], [], ["a"], undefined],
      ["a single value that is replaced", false, "old", "new", "old", "new"],
      [
        "a single value that is cleared",
        false,
        "old",
        undefined,
        "old",
        undefined,
      ],
      ["a single value that is set", false, undefined, "new", undefined, "new"],
    ])(
      "should show %s",
      (_, isArray, before, after, expectedRemoved, expectedAdded) => {
        const result = change(before, after, isArray);

        expect(result.removed).toEqual(expectedRemoved);
        expect(result.added).toEqual(expectedAdded);
      },
    );

    it("should show the change of each record of a change of several records", () => {
      fieldConfigs["center"] = { id: "center" };
      initDialog(
        [{ ...affected(FIRST, ["new"], 1), sourceFieldId: "center" }],
        [
          centerChange("first-child", "old", "new"),
          centerChange("second-child", "other", "new"),
        ],
      );

      expect(
        component
          .groups()[0]
          .triggers.map(({ trigger, changes }) => [
            trigger.entity.getId(),
            changes[0].removed?.["center"],
            changes[0].added?.["center"],
          ]),
      ).toEqual([
        ["Entity:first-child", "old", "new"],
        ["Entity:second-child", "other", "new"],
      ]);
    });

    it("should show neither removed nor added values if the field did not change", () => {
      const result = change([A], [A], true);

      expect(result).toEqual({
        isChanged: false,
        removed: undefined,
        added: undefined,
      });
    });
  });

  describe("removed values", () => {
    const A = "a";
    const B = "b";

    /** a field that collects values, with the given suggested and saved values (database format) */
    function collecting(newValue: string[], savedValue: string[]) {
      return {
        ...affected(FIRST, newValue, 1),
        savedValue,
        addToExisting: true,
        selectedField: { id: "tags", isArray: true },
      };
    }

    function removedValues() {
      return row(FIRST).removedEntity?.["tags"];
    }

    it.each([
      [
        "the saved values that the suggested value does not have any more",
        [A],
        [A, B],
        [B],
      ],
      ["no removed values if all saved values stay", [A, B], [A], undefined],
    ])("should show %s", (_, newValue, savedValue, expected) => {
      initDialog([collecting(newValue, savedValue)]);

      expect(removedValues()).toEqual(expected);
    });

    it("should update the removed values when the user changes the value or uses the suggestion again", () => {
      initDialog([collecting([A], [A, B])]);

      edit(FIRST, [A, B]);
      expect(removedValues()).toBeUndefined();

      edit(FIRST, []);
      expect(removedValues()).toEqual([A, B]);

      component.useSuggestion(row(FIRST));
      expect(removedValues()).toEqual([B]);
    });

    it("should not show removed values for a field that replaces the value", () => {
      initDialog([{ ...affected(FIRST, [A], 1), savedValue: [A, B] }]);

      expect(row(FIRST).removedEntity).toBeUndefined();
    });
  });
});
