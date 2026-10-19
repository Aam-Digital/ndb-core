import { TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
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
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { asArray } from "#src/app/utils/asArray";
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

const mockMultiTypeAutomationConfig = {
  mode: "inherited-field" as DefaultValueMode,
  config: {
    sourceReferenceEntity: "Assignment",
    sourceValueField: "title",
    sourceReferenceField: "relatedEntities",
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
  @DatabaseField({
    defaultValue: mockMultiTypeAutomationConfig,
  })
  latestAssignment: string;
}

@DatabaseEntity("Assignment")
class Assignment extends Entity {
  @DatabaseField()
  title: string;
  @DatabaseField({
    dataType: "entity",
    isArray: true,
    additional: ["Mentee", "School"],
  })
  relatedEntities: string[] = [];
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
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
  })
  mainTag: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "AggregatingAction",
        sourceReferenceField: "parentAction",
        sourceValueField: "mainTag",
        aggregation: "add",
      },
    },
  })
  mainTags: ConfigurableEnumValue[];
}

@DatabaseEntity("CommonValueGroup")
class CommonValueGroup extends Entity {
  @DatabaseField({ dataType: "entity", additional: "School", isArray: true })
  members: string[];
  @DatabaseField({
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceField: "members",
        sourceValueField: "category",
      },
    },
  })
  category: string;
}

const isIndexOfParentAction = ([, , field]: string[]) =>
  field === "parentAction";

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

  function createSchool(categoryId?: string): School {
    const school = new School();
    school.category = TEST_SCHOOL_ENUM.find((e) => e.id === categoryId);
    return school;
  }

  /** Like the real indexing service this finds the records of a type by a reference property. */
  let mockIndexing: {
    generateIndexOnProperty: ReturnType<typeof vi.fn>;
    queryIndexDocs: ReturnType<typeof vi.fn>;
  };

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
    entityRegistry.set("Assignment", Assignment);
    entityRegistry.set("AggregatingAction", AggregatingAction);
    entityRegistry.set("CommonValueGroup", CommonValueGroup);

    mockIndexing = {
      generateIndexOnProperty: vi.fn().mockResolvedValue(undefined),
      queryIndexDocs: vi.fn(),
    };
    mockIndexing.queryIndexDocs.mockImplementation(
      async (ctor: EntityConstructor, indexName: string, key: string) => {
        const field = indexName.split("/by_")[1];
        return entityMapper
          .getAllData()
          .filter(
            (record) =>
              Entity.extractTypeFromId(record.getId()) === ctor.ENTITY_TYPE,
          )
          .filter((record) => asArray(record[field]).includes(key));
      },
    );
    TestBed.configureTestingModule({
      providers: [
        AutomatedFieldUpdateConfigService,
        { provide: DatabaseIndexingService, useValue: mockIndexing },
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

  describe("source reference field that can hold several entity types", () => {
    let warn: MockInstance;

    beforeEach(() => {
      warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it.each([
      [
        "ids of other entity types",
        (mentee: Mentee) => ["School:s1", mentee.getId()],
      ],
      [
        "an id without type prefix",
        (mentee: Mentee) => [Entity.extractEntityIdFromId(mentee.getId())],
      ],
    ])(
      "should update the mentee and not try to load %s as a mentee",
      async (_, relatedIdsOf) => {
        const mentee = new Mentee();
        mentee.name = "Mentee A";
        mentee.getSchema();

        const assignment = new Assignment();
        assignment.relatedEntities = relatedIdsOf(mentee);
        entityMapper.addAll([mentee, assignment]);

        const originalAssignment = assignment.copy();
        assignment.title = "interview scheduled";

        await service.applyRulesToDependentEntities(
          assignment,
          originalAssignment,
        );

        const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
        expect(updatedMentee.latestAssignment).toBe("interview scheduled");
        expect(warn).not.toHaveBeenCalled();
      },
    );
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

  it("should pass the value of an existing mentorship on to a newly linked mentee", async () => {
    const mentee = new Mentee();
    mentee.status = "open for mentorship";
    const mentorship = new Mentorship();
    mentorship.status = TEST_MENTORSHIP_ENUM[0];
    entityMapper.addAll([mentee, mentorship]);
    const originalMentorship = mentorship.copy();

    mentorship.mentee = mentee.getId();
    await service.applyRulesToDependentEntities(mentorship, originalMentorship);

    const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(updatedMentee.status).toBe("in-mentorship");
  });

  it("should not clear the value of a mentee when a mentorship without value is linked", async () => {
    const mentee = new Mentee();
    mentee.status = "open for mentorship";
    const mentorship = new Mentorship();
    entityMapper.addAll([mentee, mentorship]);
    const originalMentorship = mentorship.copy();
    mockDialog.open.mockClear();

    mentorship.mentee = mentee.getId();
    await service.applyRulesToDependentEntities(mentorship, originalMentorship);

    expect(mockDialog.open).not.toHaveBeenCalled();
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
    function createSubAction(parent: AggregatingAction, tags: string[]) {
      const subAction = new AggregatingAction();
      subAction.parentAction = parent.getId();
      subAction.tags = toTags(tags);
      return subAction;
    }

    async function saveSubActionTags(
      parentTags: string[] | undefined,
      tagsBefore: string[],
      tagsAfter: string[],
      otherSubActionTags: string[][] = [],
    ) {
      const parent = new AggregatingAction();
      parent.tags = toTags(parentTags);
      const subAction = createSubAction(parent, tagsBefore);
      subAction._rev = "1-existing";
      const otherSubActions = otherSubActionTags.map((tags) =>
        createSubAction(parent, tags),
      );
      entityMapper.addAll([parent, subAction, ...otherSubActions]);

      const subActionBefore = subAction.copy();
      subAction.tags = toTags(tagsAfter);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(subAction, subActionBefore);
    }

    /**
     * Save a sub-action that was moved from one parent to another, without changing its tags.
     * @param from tags of the previous parent (undefined: was not linked before)
     * @param to tags of the new parent (undefined: not linked anymore)
     */
    async function saveMovedSubAction(
      from: string[] | undefined,
      to: string[] | undefined,
      tags: string[],
      otherSubActionsOfPreviousParent: string[][] = [],
    ) {
      const previousParent = new AggregatingAction();
      previousParent.tags = toTags(from);
      const newParent = new AggregatingAction();
      newParent.tags = toTags(to);
      const subAction = createSubAction(previousParent, tags);
      subAction._rev = "1-existing";
      if (!from) subAction.parentAction = undefined;
      const others = otherSubActionsOfPreviousParent.map((t) =>
        createSubAction(previousParent, t),
      );
      entityMapper.addAll([previousParent, newParent, subAction, ...others]);

      const subActionBefore = subAction.copy();
      subAction.parentAction = to ? newParent.getId() : undefined;
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(subAction, subActionBefore);

      return { previousParent, newParent };
    }

    const suggestions = () =>
      mockDialog.open.mock.calls[0]?.[1].data.entities.map((e) => [
        e.id,
        e.newValue,
      ]);

    it.each([
      [["health"], [], ["education"], [], ["health", "education"]],
      [undefined, [], ["education"], [], ["education"]],
      [
        ["water", "health"],
        ["health"],
        ["health", "education"],
        [],
        ["water", "health", "education"],
      ],
      [["health", "education"], ["education"], [], [], ["health"]],
      [
        ["health", "education"],
        ["health", "education"],
        ["education"],
        [],
        ["education"],
      ],
      [
        ["health", "education"],
        ["education"],
        ["water"],
        [],
        ["health", "water"],
      ],
      [["health", "education"], ["education"], [], [["water"]], ["health"]],
    ])(
      "parent %j + sub-action changed from %j to %j (other sub-actions %j) suggests %j",
      async (parentTags, tagsBefore, tagsAfter, others, expectedSuggestion) => {
        await saveSubActionTags(parentTags, tagsBefore, tagsAfter, others);

        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = mockDialog.open.mock.calls[0][1].data.entities[0];
        expect(suggestion.newValue).toEqual(expectedSuggestion);
        expect(suggestion.addToExisting).toBe(true);
      },
    );

    it.each([
      [["health", "education"], [], ["education"], []],
      [undefined, ["health"], [], []],
      [["health", "education"], ["education"], [], [["education", "water"]]],
      [
        ["health", "education"],
        ["health", "education"],
        ["health"],
        [["education"]],
      ],
    ])(
      "parent %j + sub-action changed from %j to %j (other sub-actions %j) opens no dialog",
      async (parentTags, tagsBefore, tagsAfter, others) => {
        await saveSubActionTags(parentTags, tagsBefore, tagsAfter, others);

        expect(mockDialog.open).not.toHaveBeenCalled();
      },
    );

    it("does not remove values of a pre-filled new sub-action that were never collected", async () => {
      const parent = new AggregatingAction();
      parent.tags = toTags(["health", "education"]);
      const subAction = createSubAction(parent, ["education"]);
      entityMapper.addAll([parent, subAction]);

      const subActionBefore = subAction.copy();
      subAction.tags = toTags([]);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(subAction, subActionBefore);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    describe("loading the sub-actions of a parent through the reference index", () => {
      it("creates the index of the reference field once and queries it with the parent id", async () => {
        const parent = new AggregatingAction();
        parent.tags = toTags(["health", "education"]);
        const subAction = createSubAction(parent, ["education"]);
        subAction._rev = "1-existing";
        entityMapper.addAll([parent, subAction]);
        const subActionBefore = subAction.copy();
        subAction.tags = toTags([]);

        await service.applyRulesToDependentEntities(subAction, subActionBefore);
        await service.applyRulesToDependentEntities(subAction, subActionBefore);

        expect(
          mockIndexing.generateIndexOnProperty.mock.calls.filter(
            isIndexOfParentAction,
          ),
        ).toEqual([
          [
            "linking_AggregatingAction_parentAction",
            AggregatingAction,
            "parentAction",
          ],
        ]);
        expect(mockIndexing.queryIndexDocs).toHaveBeenCalledWith(
          AggregatingAction,
          "linking_AggregatingAction_parentAction/by_parentAction",
          parent.getId(),
        );
      });

      it("loads and checks all records of the type if the index cannot be queried", async () => {
        mockIndexing.queryIndexDocs.mockRejectedValue(new Error("no index"));

        await saveSubActionTags(
          ["health", "education"],
          ["education"],
          [],
          [["water"]],
        );

        // "education" is removed, as no other sub-action has it
        expect(
          mockDialog.open.mock.calls[0][1].data.entities[0].newValue,
        ).toEqual(["health"]);
      });

      it("does not remove values if neither the index nor the records of the type can be loaded", async () => {
        mockIndexing.queryIndexDocs.mockRejectedValue(new Error("no index"));
        // only the check of the other sub-actions fails
        vi.spyOn(entityMapper, "loadType").mockRejectedValueOnce(
          new Error("no access"),
        );

        await saveSubActionTags(["health", "education"], ["education"], []);

        expect(mockDialog.open).not.toHaveBeenCalled();
      });

      it("still updates records linking to the changed entity if the index cannot be queried", async () => {
        mockIndexing.queryIndexDocs.mockRejectedValue(new Error("no index"));
        const school = new School();
        school.category = TEST_SCHOOL_ENUM[0];
        const child = new Child();
        child.school = school.getId();
        child.category = "old";
        entityMapper.addAll([school, child]);
        const originalSchool = school.copy();

        school.category = TEST_SCHOOL_ENUM[1];
        await service.applyRulesToDependentEntities(school, originalSchool);

        const updatedChild = await entityMapper.load(Child, child.getId());
        expect(updatedChild.category).toBe("secondary-student");
      });
    });

    describe("updating the linked parent from the sub-action", () => {
      function createLinkedSubAction(
        parentTags: string[],
        subActionTags: string[],
      ) {
        const parent = new AggregatingAction();
        parent.tags = toTags(parentTags);
        const subAction = createSubAction(parent, subActionTags);
        subAction._rev = "1-existing";
        entityMapper.addAll([parent, subAction]);
        mockDialog.open.mockClear();
        return subAction;
      }

      it("suggests the sub-action's values for the parent even if the field was not changed", async () => {
        const subAction = createLinkedSubAction(["health"], ["education"]);

        const wasOpened = await service.updateLinkedRecords(subAction, "tags");

        expect(wasOpened).toBe(true);
        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = mockDialog.open.mock.calls[0][1].data.entities[0];
        expect(suggestion.newValue).toEqual(["health", "education"]);
      });

      it("does not open the dialog if the parent is up to date", async () => {
        const subAction = createLinkedSubAction(["education"], ["education"]);

        const wasOpened = await service.updateLinkedRecords(subAction, "tags");

        expect(wasOpened).toBe(false);
        expect(mockDialog.open).not.toHaveBeenCalled();
      });

      it("does not open the dialog for a field that is not passed on to the parent", async () => {
        const subAction = createLinkedSubAction(["health"], ["education"]);

        const wasOpened = await service.updateLinkedRecords(
          subAction,
          "category",
        );

        expect(wasOpened).toBe(false);
        expect(mockDialog.open).not.toHaveBeenCalled();
      });

      it("offers the update only for fields passed on to an existing parent", () => {
        const linkedSubAction = createLinkedSubAction([], ["education"]);
        const unlinkedSubAction = new AggregatingAction();
        unlinkedSubAction._rev = "1-existing";
        const newSubAction = createSubAction(new AggregatingAction(), []);

        expect(service.hasLinkedRecordsToUpdate(linkedSubAction, "tags")).toBe(
          true,
        );
        expect(
          service.hasLinkedRecordsToUpdate(linkedSubAction, "category"),
        ).toBe(false);
        expect(
          service.hasLinkedRecordsToUpdate(unlinkedSubAction, "tags"),
        ).toBe(false);
        expect(service.hasLinkedRecordsToUpdate(newSubAction, "tags")).toBe(
          false,
        );
      });
    });

    describe("when the link to the parent changes", () => {
      it("adds the values of an existing sub-action to the parent it is newly linked to", async () => {
        const { newParent } = await saveMovedSubAction(
          undefined,
          ["health"],
          ["education"],
        );

        expect(suggestions()).toEqual([
          [newParent.getId(), ["health", "education"]],
        ]);
      });

      it("adds the values to the new parent and removes those only this sub-action had from the previous parent", async () => {
        const { previousParent, newParent } = await saveMovedSubAction(
          ["health", "education"],
          [],
          ["education"],
        );

        expect(suggestions()).toEqual([
          [newParent.getId(), ["education"]],
          [previousParent.getId(), ["health"]],
        ]);
      });

      it("keeps values of the previous parent that another sub-action still has", async () => {
        const { newParent } = await saveMovedSubAction(
          ["health", "education"],
          [],
          ["education"],
          [["education"]],
        );

        expect(suggestions()).toEqual([[newParent.getId(), ["education"]]]);
      });

      it("removes the values only this sub-action had when it is unlinked from its parent", async () => {
        const { previousParent } = await saveMovedSubAction(
          ["health", "education"],
          undefined,
          ["education"],
        );

        expect(suggestions()).toEqual([[previousParent.getId(), ["health"]]]);
      });

      it("removes the single value of a sub-action when it is unlinked from its parent", async () => {
        const parent = new AggregatingAction();
        parent.mainTags = toTags(["health", "education"]);
        const subAction = new AggregatingAction();
        subAction.parentAction = parent.getId();
        subAction.mainTag = toTagValue("education");
        subAction._rev = "1-existing";
        entityMapper.addAll([parent, subAction]);

        const subActionBefore = subAction.copy();
        subAction.parentAction = undefined;
        mockDialog.open.mockClear();
        await service.applyRulesToDependentEntities(subAction, subActionBefore);

        const suggestion = mockDialog.open.mock.calls[0][1].data.entities[0];
        expect(suggestion.id).toBe(parent.getId());
        expect(suggestion.newValue).toEqual(["health"]);
        expect(suggestion.unlinked).toBe(true);
      });

      it.each([
        ["has no values", [], ["health"]],
        ["has only values the new parent already has", ["health"], ["health"]],
      ])(
        "opens no dialog if the newly linked sub-action %s to add",
        async (_, tags, parentTags) => {
          await saveMovedSubAction(undefined, parentTags, tags);

          expect(mockDialog.open).not.toHaveBeenCalled();
        },
      );
    });
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
        expect(suggestion.addToExisting).toBe(false);
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
  describe("group linking several schools", () => {
    async function saveSchoolCategory(
      otherSchoolCategories: string[],
      newCategory: string | undefined,
      groupCategory: string | undefined,
      previousCategory?: string,
    ) {
      const school = createSchool(previousCategory);
      const otherSchools = otherSchoolCategories.map(createSchool);
      const group = new CommonValueGroup();
      group.members = [school, ...otherSchools].map((s) => s.getId());
      group.category = groupCategory;
      entityMapper.addAll([school, ...otherSchools, group]);

      const schoolBefore = school.copy();
      school.category = TEST_SCHOOL_ENUM.find((e) => e.id === newCategory);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(school, schoolBefore);
    }

    it.each([
      [["primary"], "primary", undefined, "primary"],
      [["primary", "primary"], "primary", "secondary", "primary"],
      [[undefined], "primary", undefined, "primary"],
    ])(
      "other schools %j + saved school changed to %s (group has %s) suggests %s",
      async (others, newCategory, groupCategory, expected) => {
        await saveSchoolCategory(others, newCategory, groupCategory);

        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = mockDialog.open.mock.calls[0][1].data.entities.find(
          (e) => e.targetEntityType === CommonValueGroup,
        );
        expect(suggestion.newValue).toBe(expected);
        expect(suggestion.noCommonValue).toBeUndefined();
      },
    );

    it("suggests clearing the value of the group if none of its schools has a category anymore", async () => {
      await saveSchoolCategory([undefined], undefined, "primary", "primary");

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      const suggestion = mockDialog.open.mock.calls[0][1].data.entities.find(
        (e) => e.targetEntityType === CommonValueGroup,
      );
      expect(suggestion.newValue).toBeUndefined();
      expect(suggestion.noCommonValue).toBeUndefined();
    });

    it("keeps the current value of the group and notes that the schools have no category in common", async () => {
      await saveSchoolCategory(["secondary"], "primary", "secondary");

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      const suggestion = mockDialog.open.mock.calls[0][1].data.entities.find(
        (e) => e.targetEntityType === CommonValueGroup,
      );
      expect(suggestion.newValue).toBe("secondary");
      expect(suggestion.noCommonValue).toBe("conflict");
    });

    it("keeps the current value of the group and notes that some of its schools could not be loaded", async () => {
      const school = createSchool("secondary");
      const group = new CommonValueGroup();
      group.members = [school.getId(), "School:not-accessible"];
      group.category = "secondary";
      entityMapper.addAll([school, group]);
      const schoolBefore = school.copy();
      school.category = TEST_SCHOOL_ENUM.find((e) => e.id === "primary");
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(school, schoolBefore);

      const suggestion = mockDialog.open.mock.calls[0][1].data.entities.find(
        (e) => e.targetEntityType === CommonValueGroup,
      );
      expect(suggestion.newValue).toBe("secondary");
      expect(suggestion.noCommonValue).toBe("unavailable");
    });

    it("does not save the group again if the dialog is confirmed without a change of its value", async () => {
      const saveSpy = vi.spyOn(entityMapper, "save");

      await saveSchoolCategory(["secondary"], "primary", "secondary");

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      expect(
        saveSpy.mock.calls.some(([e]) => e instanceof CommonValueGroup),
      ).toBe(false);
    });

    it.each([
      [["secondary"], "primary", undefined],
      [["primary"], "primary", "primary"],
    ])(
      "other schools %j + saved school changed to %s (group has %s) does not update the group",
      async (others, newCategory, groupCategory) => {
        await saveSchoolCategory(others, newCategory, groupCategory);

        const updatedEntities = mockDialog.open.mock.calls.flatMap(
          (call) => call[1].data.entities,
        );
        expect(
          updatedEntities.some((e) => e.targetEntityType === CommonValueGroup),
        ).toBe(false);
      },
    );
  });
});
