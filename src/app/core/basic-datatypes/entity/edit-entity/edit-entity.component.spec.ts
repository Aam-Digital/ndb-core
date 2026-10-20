import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { FormControl, FormGroup, NgControl } from "@angular/forms";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { Entity } from "../../../entity/model/entity";
import { LoginState } from "../../../session/session-states/login-state.enum";
import { EntityDatatype } from "../entity.datatype";
import {
  applyTextToCreatedEntity,
  EditEntityComponent,
} from "./edit-entity.component";

describe("EditEntityComponent", () => {
  let component: EditEntityComponent;
  let fixture: ComponentFixture<EditEntityComponent<any>>;
  let test1Entities: TestEntity[];
  let test2Entities: Test2Entity[];
  let formControl: FormControl;
  let loadTypeSpy: ReturnType<typeof vi.spyOn>;

  @DatabaseEntity("Test2Entity")
  class Test2Entity extends TestEntity {}

  beforeEach(async () => {
    formControl = new FormControl();

    test1Entities = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
      return new TestEntity(s);
    });
    test2Entities = [new Test2Entity(), new Test2Entity()];
    const otherEntities: Entity[] = [createEntityOfType("OtherEntityType")];

    await TestBed.configureTestingModule({
      imports: [
        EditEntityComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...test1Entities,
          ...test2Entities,
          ...otherEntities,
        ]),
      ],
      providers: [{ provide: NgControl, useValue: { control: formControl } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityComponent);
    component = fixture.componentInstance;

    const entityMapper = TestBed.inject(EntityMapperService);
    loadTypeSpy = vi
      .spyOn(entityMapper, "loadType")
      .mockImplementation(async (type: string) => {
        if (type === TestEntity.ENTITY_TYPE) {
          return test1Entities as any;
        }
        if (type === Test2Entity.ENTITY_TYPE) {
          return test2Entities as any;
        }
        return [];
      });
    vi.spyOn(entityMapper, "load").mockImplementation(async (_type, id) => {
      const entity = [...test1Entities, ...test2Entities].find(
        (e) => e.getId() === id,
      );
      if (entity) {
        return entity as any;
      }
      throw Object.assign(new Error(`${id} not found`), { status: 404 });
    });

    setupCustomFormControlEditComponent(
      component,
      "testProperty",
      {
        additional: TestEntity.ENTITY_TYPE,
      },
      fixture,
    );
    component.ngControl = { control: formControl } as any;
  });

  async function refreshAvailableEntities() {
    await vi.waitFor(() =>
      expect((component as any).allEntities.isLoading()).toBe(false),
    );
    component.control().setValue(component.control().value);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.isLoading()).toBe(false),
    );
  }

  function testMultiFlag(
    formFieldConfig: Partial<FormFieldConfig>,
    expectedMulti: boolean,
  ) {
    component.multi = !expectedMulti;
    fixture.componentRef.setInput("formFieldConfig", {
      id: "test",
      ...formFieldConfig,
    });
    component.ngOnInit();
    expect(!!component.multi).toBe(expectedMulti);
  }

  it("should detect 'multi' select for array datatypes", () => {
    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
        isArray: true,
      },
      true,
    );

    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
      },
      false,
    );
  });

  it("should smartly distribute the input text to all toStringAttributes when creating a new record", async () => {
    class TestEntity extends Entity {
      static override toStringAttributes = ["firstName", "lastName"];
    }

    expect(applyTextToCreatedEntity(new TestEntity(), "one")).toEqual(
      expect.objectContaining({ firstName: "one" }),
    );
    expect(applyTextToCreatedEntity(new TestEntity(), "one two")).toEqual(
      expect.objectContaining({ firstName: "one", lastName: "two" }),
    );
    expect(applyTextToCreatedEntity(new TestEntity(), "one    two")).toEqual(
      expect.objectContaining({ firstName: "one", lastName: "two" }),
    );
    // if more input parts than toStringAttributes, put all remaining parts into last property:
    expect(applyTextToCreatedEntity(new TestEntity(), "one two three")).toEqual(
      expect.objectContaining({ firstName: "one", lastName: "two three" }),
    );
  });

  it("should not be in loading-state when all data is received", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    await vi.waitFor(() => expect(component.loading()).toBe(false));
  });

  it("should suggest all entities after an initial load", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value()).toHaveLength(
        test1Entities.length,
      ),
    );

    expect(component.availableEntitiesResource.value()).toHaveLength(
      test1Entities.length,
    );
    expect(component.availableEntitiesResource.value()).toEqual(
      expect.arrayContaining(test1Entities),
    );
  });

  it("suggests all entities of multiple different types if configured", async () => {
    fixture.componentRef.setInput("entityType", [
      TestEntity.ENTITY_TYPE,
      Test2Entity.ENTITY_TYPE,
    ]);
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value()).toHaveLength(
        test1Entities.length + test2Entities.length,
      ),
    );

    expect(component.availableEntitiesResource.value()).toEqual(
      [...test1Entities, ...test2Entities].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  });

  it("should log warning when loading entity fails with unexpected error", async () => {
    const warnSpy = vi.spyOn(Logging, "warn");
    const entityMapper = TestBed.inject(EntityMapperService);
    vi.spyOn(entityMapper, "load").mockRejectedValue(
      Object.assign(new Error("server error"), { status: 500 }),
    );

    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    component.control().setValue([test1Entities[0].getId()]);
    fixture.detectChanges();

    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("ENTITY_SELECT"),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("shows inactive entities according to the includeInactive state", async () => {
    test1Entities[0].inactive = true;
    test1Entities[2].inactive = true;
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value().length).toEqual(
        test1Entities.length - 2,
      ),
    );

    expect(component.availableEntitiesResource.value().length).toEqual(
      test1Entities.length - 2,
    );
    component.toggleIncludeInactive();
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value().length).toEqual(
        test1Entities.length,
      ),
    );
    expect(component.availableEntitiesResource.value().length).toEqual(
      test1Entities.length,
    );

    test1Entities[2].inactive = false;
    component.toggleIncludeInactive();
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value().length).toEqual(3),
    );
    expect(component.availableEntitiesResource.value().length).toEqual(3);
  });

  it("should update matchingInactive count when autocomplete filter changes", async () => {
    const testEntities = [
      TestEntity.create("AB"),
      TestEntity.create("AC"),
      TestEntity.create("X"),
    ];
    testEntities.forEach((e) => (e.inactive = true));
    loadTypeSpy.mockResolvedValue(testEntities as any);

    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(component.currentlyMatchingInactive()).toBe(3),
    );
    expect(component.currentlyMatchingInactive()).toBe(3);

    component.recalculateMatchingInactive((o) => o["name"].startsWith("A"));
    await vi.waitFor(() =>
      expect(component.currentlyMatchingInactive()).toBe(2),
    );
    expect(component.currentlyMatchingInactive()).toBe(2);
  });

  it("should show selected entities of type that is not configured", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    component
      .control()
      .setValue([test1Entities[0].getId(), test2Entities[0].getId()]);
    fixture.detectChanges();
    await refreshAvailableEntities();
    await vi.waitFor(() =>
      expect(component.availableEntitiesResource.value()).toHaveLength(
        test1Entities.length + 1,
      ),
    );

    expect(component.control().value).toHaveLength(2);

    expect(component.control().value).toEqual(
      expect.arrayContaining([
        test1Entities[0].getId(),
        test2Entities[0].getId(),
      ]),
    );
    expect(component.availableEntitiesResource.value()).toHaveLength(
      test1Entities.length + 1,
    );
    expect(component.availableEntitiesResource.value()).toEqual(
      expect.arrayContaining([...test1Entities, test2Entities[0]]),
    );
  });

  it("should ignore a value that is not an entity id", async () => {
    // e.g. a misconfigured inherited default value can put a whole object here
    const debugSpy = vi.spyOn(Logging, "debug");
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    component
      .control()
      .setValue([{ id: "SOME_OPTION", label: "Some option" } as any]);
    fixture.detectChanges();
    await refreshAvailableEntities();

    expect(component.availableEntitiesResource.error()).toBeUndefined();
    expect(component.availableEntitiesResource.value()).toEqual(
      expect.arrayContaining(test1Entities),
    );
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("non-id value"),
      expect.anything(),
    );
  });

  it("should expose one create option per entity type when multiple types are configured", () => {
    fixture.componentRef.setInput("entityType", [
      TestEntity.ENTITY_TYPE,
      Test2Entity.ENTITY_TYPE,
    ]);
    fixture.detectChanges();

    const options = component.createNewEntityOptions();

    expect(options).toHaveLength(2);
    expect(options[0].label).toBe(TestEntity.label ?? TestEntity.ENTITY_TYPE);
    expect(options[1].label).toBe(Test2Entity.label ?? Test2Entity.ENTITY_TYPE);
    expect(options[0].create).toBeTypeOf("function");
    expect(options[1].create).toBeTypeOf("function");
  });

  it("should create a new entity when user selects 'add new' and apply input text", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    const formDialogSpy = vi.spyOn(
      TestBed.inject(FormDialogService),
      "openFormPopup",
    );
    const savedEntity = new TestEntity("123");

    formDialogSpy.mockReturnValue({ afterClosed: () => of(undefined) } as any);
    const resultCancel = await component.createNewEntity("my new record");
    expect(resultCancel).toBeUndefined();

    formDialogSpy.mockReturnValue({
      afterClosed: () => of(savedEntity),
    } as any);
    const resultSave = await component.createNewEntity("my new record");
    expect(resultSave).toEqual(savedEntity);
    expect(formDialogSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my new record" }),
    );
  });

  describe("with a selectionCondition", () => {
    const female = () => ({ id: "F", label: "female" });
    const male = () => ({ id: "M", label: "male" });

    beforeEach(() => {
      ["Abc", "Bcd", "Abd", "Aba"].forEach(
        (name, i) => (test1Entities[i].name = name),
      );
      ["BERLIN", "HAMBURG", "BERLIN", undefined].forEach(
        (location, i) => (test1Entities[i].other = location),
      );
      [female(), male(), female(), undefined].forEach(
        (category, i) => (test1Entities[i].category = category),
      );
    });

    /**
     * Render the field as part of the form of a record with the given (unsaved) values.
     */
    function editRecordWithCondition(
      selectionCondition: DataFilter<any>,
      recordValues: Record<string, unknown> = {},
      entityType: string | string[] = TestEntity.ENTITY_TYPE,
    ): FormGroup {
      const form = new FormGroup<any>({ testProperty: formControl });
      for (const [field, value] of Object.entries(recordValues)) {
        form.addControl(field, new FormControl(value));
      }
      fixture.componentRef.setInput("formFieldConfig", {
        id: "testProperty",
        additional: entityType,
        selectionCondition,
      });
      fixture.componentRef.setInput("entity", new TestEntity());
      fixture.detectChanges();
      return form;
    }

    async function expectOfferedNames(expected: string[]) {
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(
          sortedNames(component.availableEntitiesResource.value()),
        ).toEqual(expected);
      });
    }

    it.each([
      ["a fixed condition", { other: { $in: ["BERLIN"] } }, {}, ["Abc", "Abd"]],
      [
        "a condition referring to a field of the record being edited",
        { other: { $in: ["$current_record.other"] } },
        { other: "HAMBURG" },
        ["Bcd"],
      ],
      [
        "a condition referring to an enum field of the record being edited",
        { category: { $in: ["$current_record.category"] } },
        { category: female() },
        ["Abc", "Abd"],
      ],
      [
        "a condition referring to an empty field of the record being edited (not applied)",
        { other: { $in: ["$current_record.other"] } },
        { other: null },
        ["Aba", "Abc", "Abd", "Bcd"],
      ],
      [
        "a fixed condition next to a condition referring to an empty field (only the latter is not applied)",
        {
          other: { $in: ["BERLIN"] },
          category: { $in: ["$current_record.category"] },
        },
        { category: null },
        ["Abc", "Abd"],
      ],
      [
        "an alternative referring to an empty field (only that alternative is not applied)",
        {
          $or: [
            { other: { $in: ["BERLIN"] } },
            { category: { $in: ["$current_record.category"] } },
          ],
        },
        { category: null },
        ["Abc", "Abd"],
      ],
    ])(
      "offers the records matching %s",
      async (_, condition, recordValues, expectedNames) => {
        editRecordWithCondition(condition, recordValues);

        await expectOfferedNames(expectedNames);
      },
    );

    it("updates the offered records when the record being edited is changed", async () => {
      const form = editRecordWithCondition(
        { other: { $in: ["$current_record.other"] } },
        { other: "HAMBURG" },
      );
      await expectOfferedNames(["Bcd"]);

      form.get("other").setValue("BERLIN");
      fixture.detectChanges();

      await expectOfferedNames(["Abc", "Abd"]);
    });

    it("does not apply the condition to a field referencing multiple entity types", async () => {
      editRecordWithCondition({ other: { $in: ["BERLIN"] } }, {}, [
        TestEntity.ENTITY_TYPE,
        Test2Entity.ENTITY_TYPE,
      ]);

      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(component.availableEntitiesResource.value()).toHaveLength(
          test1Entities.length + test2Entities.length,
        );
      });
    });

    it("keeps offering a selected record that does not match the condition", async () => {
      formControl.setValue(test1Entities[1].getId()); // Bcd in HAMBURG
      editRecordWithCondition({ other: { $in: ["BERLIN"] } });

      await expectOfferedNames(["Abc", "Abd", "Bcd"]);
    });

    it("counts the records each toggle would additionally show", async () => {
      test1Entities[1].inactive = true; // Bcd: not matching, inactive
      test1Entities[2].inactive = true; // Abd: matching, inactive
      editRecordWithCondition({ other: { $in: ["BERLIN"] } });
      await expectOfferedNames(["Abc"]);
      expect(component.currentlyMatchingInactive()).toBe(1);
      expect(component.currentlyMatchingIneligible()).toBe(1);

      component.toggleIncludeIneligible();
      fixture.detectChanges();

      await expectOfferedNames(["Aba", "Abc"]);
      expect(component.currentlyMatchingInactive()).toBe(2);
      expect(component.currentlyMatchingIneligible()).toBe(1);
    });

    it("does not count selected records, which are shown anyway", async () => {
      test1Entities[2].inactive = true; // Abd: matching, inactive
      formControl.setValue([
        test1Entities[1].getId(), // Bcd: not matching
        test1Entities[2].getId(),
      ]);
      editRecordWithCondition({ other: { $in: ["BERLIN"] } });
      await expectOfferedNames(["Abc", "Abd", "Bcd"]);

      expect(component.currentlyMatchingIneligible()).toBe(1); // only Aba
      expect(component.currentlyMatchingInactive()).toBe(0);
    });

    it("keeps an invalid condition out of remote monitoring and its record values out of the logs", async () => {
      const warnSpy = vi.spyOn(Logging, "warn");
      const debugSpy = vi.spyOn(Logging, "debug");

      editRecordWithCondition(
        { other: { $in: "$current_record.other" } }, // resolves to a string, but $in needs a list
        { other: "SECRET-VALUE" },
      );

      await expectOfferedNames(["Aba", "Abc", "Abd", "Bcd"]);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining("selectionCondition"),
        expect.anything(),
      );
      expect(JSON.stringify(debugSpy.mock.calls)).not.toContain("SECRET-VALUE");
    });

    it("pre-fills a new record so that it matches the condition", async () => {
      editRecordWithCondition(
        { other: { $in: ["$current_record.other"] } },
        { other: "BERLIN" },
      );
      const formDialogSpy = vi
        .spyOn(TestBed.inject(FormDialogService), "openFormPopup")
        .mockReturnValue({ afterClosed: () => of(undefined) } as any);

      await component.createNewEntity("Chris");

      expect(formDialogSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Chris", other: "BERLIN" }),
      );
    });
  });
});

function sortedNames(entities: Entity[]): string[] {
  return entities.map((e) => e["name"]).sort((a, b) => a.localeCompare(b));
}
