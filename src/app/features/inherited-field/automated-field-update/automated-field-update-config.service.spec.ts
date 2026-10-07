import { TestBed } from "@angular/core/testing";
import { AutomatedFieldUpdateConfigService } from "./automated-field-update-config.service";
import { MatDialog } from "@angular/material/dialog";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  MockEntityMapperService,
  mockEntityMapperProvider,
} from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { of } from "rxjs";
import { ConfigurableEnumValue } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { DefaultValueMode } from "../../../core/default-values/default-value-config";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype";

const mockAutomationConfig = {
  mode: "inherited-field" as DefaultValueMode,
  config: {
    sourceReferenceEntity: "Mentorship",
    sourceValueField: "status",
    sourceReferenceField: "mentee",
    valueMapping: {
      active: "in-mentorship",
      finished: "open for mentorship",
    },
  },
};

const mockInheritanceConfig = {
  mode: "inherited-field" as DefaultValueMode,
  config: {
    sourceReferenceField: "school",
    sourceValueField: "category",
    valueMapping: {
      primary: "primary-student",
      secondary: "secondary-student",
    },
  },
};

@DatabaseEntity("Child")
class Child extends Entity {
  @DatabaseField()
  name: string;
  @DatabaseField({
    dataType: "entity",
    additional: "School",
  })
  school: string;
  @DatabaseField({
    defaultValue: mockInheritanceConfig,
  })
  category: string;
}

@DatabaseEntity("School")
class School extends Entity {
  @DatabaseField()
  name!: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "school-category-enum",
  })
  category: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "school-category-enum",
    isArray: true,
  })
  categories: ConfigurableEnumValue[];
}

@DatabaseEntity("Mentee")
class Mentee extends Entity {
  @DatabaseField()
  name: string;
  @DatabaseField({
    defaultValue: mockAutomationConfig,
  })
  status: string;
}

@DatabaseEntity("Mentorship")
class Mentorship extends Entity {
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "mentorship-status-enum",
  })
  status: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "entity",
    additional: "Mentee",
  })
  mentee: string;
  @DatabaseField()
  otherField: string;
}

@DatabaseEntity("AggregatingAction")
class AggregatingAction extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: "AggregatingAction",
  })
  parentAction: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "AggregatingAction",
        sourceReferenceField: "parentAction",
        sourceValueField: "tags",
        aggregation: "add",
      },
    },
  })
  tags: ConfigurableEnumValue[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceField: "parentAction",
        sourceValueField: "category",
        aggregation: "add",
      },
    },
  })
  category: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceField: "parentAction",
        sourceValueField: "tags",
      },
    },
  })
  inheritedTags: ConfigurableEnumValue[];
}

describe("AutomatedFieldUpdateConfigService", () => {
  let entityMapper: MockEntityMapperService;
  let service: AutomatedFieldUpdateConfigService;
  let entitySchemaService: EntitySchemaService;

  const TEST_MENTORSHIP_ENUM: ConfigurableEnumValue[] = [
    { id: "active", label: "Active" },
    { id: "finished", label: "Finished" },
  ];

  const TEST_SCHOOL_ENUM: ConfigurableEnumValue[] = [
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
  ];

  let mockDialogAfterClosed = () => of([]);
  const mockDialogRef = {
    afterClosed: () => mockDialogAfterClosed(),
  } as any;

  const mockDialog = {
    open: vi.fn().mockName("MatDialog.open"),
  };
  mockDialog.open.mockImplementation((component, config) => {
    mockDialogAfterClosed = () => of(config?.data?.entities || []);
    return mockDialogRef;
  });

  beforeEach(() => {
    entityRegistry.set("Child", Child);
    entityRegistry.set("School", School);
    entityRegistry.set("Mentee", Mentee);
    entityRegistry.set("Mentorship", Mentorship);
    entityRegistry.set("AggregatingAction", AggregatingAction);

    TestBed.configureTestingModule({
      providers: [
        AutomatedFieldUpdateConfigService,
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialog, useValue: mockDialog },
        // only the datatypes of the test entities' schemas, rather than a whole module
        {
          provide: DefaultDatatype,
          useClass: ConfigurableEnumDatatype,
          multi: true,
        },
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        {
          provide: ConfigurableEnumService,
          useValue: {
            getEnumValues: (id: string) =>
              id === "mentorship-status-enum"
                ? TEST_MENTORSHIP_ENUM
                : TEST_SCHOOL_ENUM,
          },
        },
      ],
    });

    service = TestBed.inject(AutomatedFieldUpdateConfigService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  it("should update mentee status when status of linked mentorship changes", async () => {
    const mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";
    mentee.getSchema();

    const mentorship = new Mentorship();
    mentorship.status = TEST_MENTORSHIP_ENUM[0];
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentee, mentorship]);

    const originalMentorship = mentorship.copy();

    mentorship.status = TEST_MENTORSHIP_ENUM[1];
    await service.applyRulesToDependentEntities(mentorship, originalMentorship);

    const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(updatedMentee.status).toBe("open for mentorship");
  });

  it("should not change mentee status when non-trigger field of mentorship changes", async () => {
    const mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";
    mentee.getSchema();

    const mentorship = new Mentorship();
    mentorship.status = TEST_MENTORSHIP_ENUM[0];
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentee, mentorship]);

    const originalMentorship = mentorship.copy();
    mentorship.otherField = "updated value";

    await service.applyRulesToDependentEntities(mentorship, originalMentorship);

    const currentMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(currentMentee.status).toBe("open for mentorship");
  });

  it("should not update mentee status if mentorship links to different mentee", async () => {
    const mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";
    mentee.getSchema();

    const mentorship = new Mentorship();
    mentorship.status = TEST_MENTORSHIP_ENUM[0];
    mentorship.mentee = mentee.getId();

    const otherMentee = new Mentee();
    otherMentee.name = "Mentee B";
    otherMentee.status = "open for mentorship";

    const otherMentorship = new Mentorship();
    otherMentorship.status = TEST_MENTORSHIP_ENUM[1];
    otherMentorship.mentee = otherMentee.getId();

    entityMapper.addAll([mentee, mentorship, otherMentee, otherMentorship]);

    const mentorshipBeforeSave = otherMentorship.copy();
    mentorshipBeforeSave.status = TEST_MENTORSHIP_ENUM[0];

    await service.applyRulesToDependentEntities(
      otherMentorship,
      mentorshipBeforeSave,
    );

    const originalMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(originalMentee.status).toBe("open for mentorship");
  });

  it("should apply automation value mapping correctly", async () => {
    const mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";
    mentee.getSchema();

    const mentorship = new Mentorship();
    mentorship.status = TEST_MENTORSHIP_ENUM[0];
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentee, mentorship]);

    const originalMentorship = mentorship.copy();
    originalMentorship.status = TEST_MENTORSHIP_ENUM[0];

    mentorship.status = TEST_MENTORSHIP_ENUM[1];
    await service.applyRulesToDependentEntities(mentorship, originalMentorship);

    const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(updatedMentee.status).toBe("open for mentorship");
  });

  it("should update child category when school category changes", async () => {
    const school = new School();
    school.name = "Test School";
    school.category = TEST_SCHOOL_ENUM[0];
    school.getSchema();

    const child = new Child();
    child.name = "Child A";
    child.school = school.getId();
    child.category = "";
    child.getSchema();

    entityMapper.addAll([school, child]);

    const originalSchool = school.copy();
    originalSchool.category = TEST_SCHOOL_ENUM[0];

    school.category = TEST_SCHOOL_ENUM[1];
    await service.applyRulesToDependentEntities(school, originalSchool);

    const updatedChild = await entityMapper.load(Child, child.getId());
    expect(updatedChild.category).toBe("secondary-student");
  });

  it("should apply inheritance value mapping correctly", async () => {
    const school = new School();
    school.name = "Test School";
    school.category = TEST_SCHOOL_ENUM[0];
    school.getSchema();

    const child = new Child();
    child.name = "Child A";
    child.school = school.getId();
    child.category = "";
    child.getSchema();

    entityMapper.addAll([school, child]);

    const originalSchool = school.copy();
    originalSchool.category = undefined;

    school.category = TEST_SCHOOL_ENUM[0];
    await service.applyRulesToDependentEntities(school, originalSchool);

    const updatedChild = await entityMapper.load(Child, child.getId());
    expect(updatedChild.category).toBe("primary-student");
  });

  it("should not update child when non-trigger school field changes", async () => {
    const school = new School();
    school.name = "Test School";
    school.category = TEST_SCHOOL_ENUM[0];
    school.getSchema();

    const child = new Child();
    child.name = "Child A";
    child.school = school.getId();
    child.category = "";
    child.getSchema();

    entityMapper.addAll([school, child]);

    const originalSchool = school.copy();
    school.name = "Updated School Name";

    await service.applyRulesToDependentEntities(school, originalSchool);

    const currentChild = await entityMapper.load(Child, child.getId());
    expect(currentChild.category).toBe("");
  });

  it("should handle multiple children referencing same school", async () => {
    const school = new School();
    school.name = "Test School";
    school.category = TEST_SCHOOL_ENUM[0];
    school.getSchema();

    const child = new Child();
    child.name = "Child A";
    child.school = school.getId();
    child.category = "";
    child.getSchema();

    const child2 = new Child();
    child2.name = "Child B";
    child2.school = school.getId();
    child2.category = "";

    entityMapper.addAll([school, child, child2]);

    const originalSchool = school.copy();
    originalSchool.category = undefined;

    school.category = TEST_SCHOOL_ENUM[1];
    await service.applyRulesToDependentEntities(school, originalSchool);

    const updatedChild1 = await entityMapper.load(Child, child.getId());
    const updatedChild2 = await entityMapper.load(Child, child2.getId());

    expect(updatedChild1.category).toBe("secondary-student");
    expect(updatedChild2.category).toBe("secondary-student");
  });

  it("should map each value of a multi-select enum source and remove duplicates", () => {
    const school = new School();
    school.categories = [TEST_SCHOOL_ENUM[0], TEST_SCHOOL_ENUM[1]];
    const rule = {
      sourceReferenceField: "school",
      sourceValueField: "categories",
      valueMapping: { primary: "primary-student", secondary: "student" },
    };

    expect(service.calculateNewValue(school, rule)).toEqual([
      "primary-student",
      "student",
    ]);

    rule.valueMapping.primary = "student";
    expect(service.calculateNewValue(school, rule)).toEqual(["student"]);
  });

  it("should fall back to the database format of an unmapped enum source value", () => {
    const school = new School();
    school.category = TEST_SCHOOL_ENUM[1];

    const result = service.calculateNewValue(school, {
      sourceReferenceField: "school",
      sourceValueField: "category",
      valueMapping: { primary: "primary-student", secondary: null },
    });

    expect(result).toBe("secondary");
  });

  it("should transform ConfigurableEnum value to database format (ID string)", () => {
    const school = new School("school1");
    const enumValue = TEST_SCHOOL_ENUM[0];
    school.category = enumValue;

    const mockSchemaService = TestBed.inject(EntitySchemaService);

    const result = service.transformSourceValueToDatabaseFormat(
      enumValue,
      school,
      "category",
      mockSchemaService,
    );

    expect(result).toBe("primary");
  });

  const TEST_TAGS: ConfigurableEnumValue[] = [
    { id: "health", label: "Health" },
    { id: "education", label: "Education" },
    { id: "water", label: "Water" },
  ];
  const toTags = (ids: string[] | undefined) =>
    ids?.map((id) => TEST_TAGS.find((t) => t.id === id));
  const toTagValue = (ids: string | string[]): any =>
    Array.isArray(ids) ? toTags(ids) : toTags([ids])[0];

  describe("aggregation 'add'", () => {
    async function saveSubActionTags(
      parentTags: string[] | undefined,
      tagsBefore: string[],
      tagsAfter: string[],
    ) {
      const parent = new AggregatingAction();
      parent.tags = toTags(parentTags);
      const subAction = new AggregatingAction();
      subAction.parentAction = parent.getId();
      subAction.tags = toTags(tagsBefore);
      entityMapper.addAll([parent, subAction]);

      const subActionBefore = subAction.copy();
      subAction.tags = toTags(tagsAfter);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(subAction, subActionBefore);
    }

    it.each([
      [["health"], [], ["education"], ["health", "education"]],
      [undefined, [], ["education"], ["education"]],
      [
        ["water", "health"],
        ["health"],
        ["health", "education"],
        ["water", "health", "education"],
      ],
    ])(
      "parent %j + sub-action changed from %j to %j suggests %j",
      async (parentTags, tagsBefore, tagsAfter, expectedSuggestion) => {
        await saveSubActionTags(parentTags, tagsBefore, tagsAfter);

        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = mockDialog.open.mock.calls[0][1].data.entities[0];
        expect(suggestion.newValue).toEqual(expectedSuggestion);
      },
    );

    it.each([
      [["health", "education"], [], ["education"]],
      [["health", "education"], ["health", "education"], ["education"]],
      [undefined, ["health"], []],
    ])(
      "parent %j + sub-action changed from %j to %j opens no dialog",
      async (parentTags, tagsBefore, tagsAfter) => {
        await saveSubActionTags(parentTags, tagsBefore, tagsAfter);

        expect(mockDialog.open).not.toHaveBeenCalled();
      },
    );
  });

  describe("values inherited from the parent action", () => {
    async function saveParentValue(
      sourceField: string,
      targetField: string,
      childValue: string | string[],
      parentValueBefore: string | string[],
      parentValueAfter: string | string[],
    ) {
      const parent = new AggregatingAction();
      parent[sourceField] = toTagValue(parentValueBefore);
      const subAction = new AggregatingAction();
      subAction.parentAction = parent.getId();
      subAction[targetField] = toTagValue(childValue);
      entityMapper.addAll([parent, subAction]);

      const parentBefore = parent.copy();
      parent[sourceField] = toTagValue(parentValueAfter);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(parent, parentBefore);
    }

    it.each([
      [
        "tags",
        "inheritedTags",
        ["health", "water"],
        ["health", "water"],
        ["water"],
        ["water"],
      ],
      ["category", "category", "health", "health", "water", "water"],
    ])(
      "%s -> %s: sub-action %j + parent changed from %j to %j suggests %j (replacing)",
      async (sourceField, targetField, childValue, before, after, expected) => {
        await saveParentValue(
          sourceField,
          targetField,
          childValue,
          before,
          after,
        );

        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = mockDialog.open.mock.calls[0][1].data.entities[0];
        expect(suggestion.newValue).toEqual(expected);
      },
    );

    it.each([
      [
        "tags",
        "inheritedTags",
        ["health", "water"],
        ["health"],
        ["health", "water"],
      ],
      ["category", "category", "water", "health", "water"],
    ])(
      "%s -> %s: sub-action %j + parent changed from %j to %j opens no dialog",
      async (sourceField, targetField, childValue, before, after) => {
        await saveParentValue(
          sourceField,
          targetField,
          childValue,
          before,
          after,
        );

        expect(mockDialog.open).not.toHaveBeenCalled();
      },
    );
  });
});
