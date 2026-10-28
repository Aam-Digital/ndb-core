import { TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
import {
  AutomatedFieldUpdateConfigService,
  MAX_ENTITIES_TO_REVIEW,
} from "./automated-field-update-config.service";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { mockConfirmationDialog } from "#src/app/utils/test-utils/dialog-mocks";
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
import { UpdateMetadata } from "#src/app/core/entity/model/update-metadata";
import { AlertService } from "#src/app/core/alerts/alert.service";
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
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";

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

/** a record that collects the tags of its sub-records and can have several parents */
@DatabaseEntity("HierarchyAction")
class HierarchyAction extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: "HierarchyAction",
    isArray: true,
  })
  parents: string[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "HierarchyAction",
        sourceReferenceField: "parents",
        sourceValueField: "tags",
        aggregation: "add",
      },
    },
  })
  tags: ConfigurableEnumValue[];
}

/** a record that takes the tags that all its member records have in common */
@DatabaseEntity("HierarchyGroup")
class HierarchyGroup extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: "HierarchyAction",
    isArray: true,
  })
  members: string[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceField: "members",
        sourceValueField: "tags",
      },
    },
  })
  tags: ConfigurableEnumValue[];
}

/** a record whose parent collects its "lowerTags" in "middleTags", from where the parent of the parent collects them in "upperTags" */
@DatabaseEntity("FieldChainAction")
class FieldChainAction extends Entity {
  @DatabaseField({ dataType: "entity", additional: "FieldChainAction" })
  parent: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
  })
  lowerTags: ConfigurableEnumValue[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "FieldChainAction",
        sourceReferenceField: "parent",
        sourceValueField: "lowerTags",
        aggregation: "add",
      },
    },
  })
  middleTags: ConfigurableEnumValue[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "FieldChainAction",
        sourceReferenceField: "parent",
        sourceValueField: "middleTags",
        aggregation: "add",
      },
    },
  })
  upperTags: ConfigurableEnumValue[];
}

/** a record whose "value" is collected in the "total" of its parent, from where it comes back down to all sub-records */
@DatabaseEntity("CycleAction")
class CycleAction extends Entity {
  @DatabaseField({ dataType: "entity", additional: "CycleAction" })
  parent: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: { sourceReferenceField: "parent", sourceValueField: "total" },
    },
  })
  value: ConfigurableEnumValue[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "CycleAction",
        sourceReferenceField: "parent",
        sourceValueField: "value",
        aggregation: "add",
      },
    },
  })
  total: ConfigurableEnumValue[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: { sourceReferenceField: "parent", sourceValueField: "total" },
    },
  })
  inheritedTotal: ConfigurableEnumValue[];
}

/** a record that takes the status of its parent, translated by a value mapping */
@DatabaseEntity("MappedStatusAction")
class MappedStatusAction extends Entity {
  @DatabaseField({ dataType: "entity", additional: "MappedStatusAction" })
  parent: string;
  @DatabaseField({
    dataType: "string",
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceField: "parent",
        sourceValueField: "status",
        valueMapping: { planned: "in planning" },
      },
    },
  })
  status: string;
}

/** a record whose "mainTag" goes down to its sub-records, from where their "tags" are collected again (like Center in the all-features config) */
@DatabaseEntity("FanOutAction")
class FanOutAction extends Entity {
  @DatabaseField({ dataType: "entity", additional: "FanOutAction" })
  parent: string;
  @DatabaseField({ dataType: "configurable-enum", additional: "action-tags" })
  mainTag: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    defaultValue: {
      mode: "inherited-field",
      config: { sourceReferenceField: "parent", sourceValueField: "mainTag" },
    },
  })
  tag: ConfigurableEnumValue;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "action-tags",
    isArray: true,
    defaultValue: {
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "FanOutAction",
        sourceReferenceField: "parent",
        sourceValueField: "tag",
        aggregation: "add",
      },
    },
  })
  subTags: ConfigurableEnumValue[];
}

describe("AutomatedFieldUpdateConfigService", () => {
  let entityMapper: MockEntityMapperService;
  let service: AutomatedFieldUpdateConfigService;
  let entitySchemaService: EntitySchemaService;
  let ability: { initialized: boolean; can: ReturnType<typeof vi.fn> };

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
  const alertService = { addDanger: vi.fn() };
  const confirmationDialog = mockConfirmationDialog();
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
    entityRegistry.set("HierarchyAction", HierarchyAction);
    entityRegistry.set("HierarchyGroup", HierarchyGroup);
    entityRegistry.set("FieldChainAction", FieldChainAction);
    entityRegistry.set("CycleAction", CycleAction);
    entityRegistry.set("CommonValueGroup", CommonValueGroup);
    entityRegistry.set("FanOutAction", FanOutAction);
    entityRegistry.set("MappedStatusAction", MappedStatusAction);

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
    ability = { initialized: true, can: vi.fn(() => true) };
    TestBed.configureTestingModule({
      providers: [
        AutomatedFieldUpdateConfigService,
        { provide: EntityAbility, useValue: ability },
        { provide: DatabaseIndexingService, useValue: mockIndexing },
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AlertService, useValue: alertService },
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
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
            getEnumValues: (id: string) => {
              if (id === "mentorship-status-enum") return TEST_MENTORSHIP_ENUM;
              return id === "action-tags" ? TEST_TAGS : TEST_SCHOOL_ENUM;
            },
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

  describe("more affected records than can be shown quickly for review", () => {
    function createSchoolWithChildren(numberOfChildren: number) {
      const school = createSchool("primary");
      const children = Array.from({ length: numberOfChildren }, () => {
        const child = new Child();
        child.school = school.getId();
        return child;
      });
      entityMapper.addAll([school, ...children]);
      return { school, children };
    }

    async function changeCategory(school: School) {
      const before = school.copy();
      school.category = TEST_SCHOOL_ENUM[1];
      mockDialog.open.mockClear();
      confirmationDialog.getConfirmation.mockClear();
      return service.applyRulesToDependentEntities(school, before);
    }

    async function loadCategories(children: Child[]) {
      const saved = await entityMapper.loadType(Child);
      return children.map(
        (child) => saved.find((s) => s.getId() === child.getId()).category,
      );
    }

    it("shows them for review directly if there are not too many", async () => {
      const { school } = createSchoolWithChildren(MAX_ENTITIES_TO_REVIEW);

      await changeCategory(school);

      expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it("counts each record once, also if several of its fields are updated", async () => {
      const project = new CycleAction();
      const activities = Array.from({ length: 60 }, () => {
        const activity = new CycleAction();
        activity.parent = project.getId();
        return activity;
      });
      [project, ...activities].forEach((a) => (a._rev = "1-existing"));
      entityMapper.addAll([project, ...activities]);
      const before = project.copy();
      project.total = toTags(["health"]);
      mockDialog.open.mockClear();
      confirmationDialog.getConfirmation.mockClear();

      await service.applyRulesToDependentEntities(project, before);

      expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
      const rows = mockDialog.open.mock.calls[0][1].data.entities;
      expect(rows.length).toBeGreaterThan(MAX_ENTITIES_TO_REVIEW);
    });

    it("asks the user first, and shows them for review if the user chooses so", async () => {
      const { school } = createSchoolWithChildren(MAX_ENTITIES_TO_REVIEW + 1);
      confirmationDialog.getConfirmation.mockResolvedValueOnce("review");

      await changeCategory(school);

      expect(confirmationDialog.getConfirmation).toHaveBeenCalledOnce();
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it("updates all of them with the suggested values without showing them, if the user chooses so", async () => {
      const { school, children } = createSchoolWithChildren(
        MAX_ENTITIES_TO_REVIEW + 1,
      );
      confirmationDialog.getConfirmation.mockResolvedValueOnce("update-all");

      const previousVersions = await changeCategory(school);

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(new Set(await loadCategories(children))).toEqual(
        new Set(["secondary-student"]),
      );
      expect(previousVersions).toHaveLength(children.length);
    });

    it.each([
      ["cancels", false],
      ["closes the question", undefined],
    ])("updates none of them if the user %s", async (_, dialogResult) => {
      const { school, children } = createSchoolWithChildren(
        MAX_ENTITIES_TO_REVIEW + 1,
      );
      confirmationDialog.getConfirmation.mockResolvedValueOnce(dialogResult);

      const previousVersions = await changeCategory(school);

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(new Set(await loadCategories(children))).toEqual(
        new Set([undefined]),
      );
      expect(previousVersions).toEqual([]);
    });
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

    /** the suggestions for the tags that the parents collect (not for the other fields of the saved record) */
    const suggestions = () =>
      mockDialog.open.mock.calls[0]?.[1].data.entities
        .filter((e) => e.targetFieldId === "tags")
        .map((e) => [e.id, e.newValue]);

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
      [
        "tags",
        "inheritedTags",
        ["water", "health"],
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

  describe("record linking several parents", () => {
    function categoryOf(id: string | undefined) {
      return TEST_SCHOOL_ENUM.find((e) => e.id === id);
    }

    /** the suggestion for the group in the dialog that was opened */
    function suggestionForGroup() {
      return mockDialog.open.mock.calls[0][1].data.entities.find(
        (e) => e.targetEntityType === CommonValueGroup,
      );
    }

    /** let loading the record with the given id fail with the given error */
    function failLoadingOf(id: string, error: unknown) {
      const load = entityMapper.load.bind(entityMapper);
      vi.spyOn(entityMapper, "load").mockImplementation((type, entityId) =>
        entityId === id ? Promise.reject(error) : load(type, entityId),
      );
    }

    async function saveSchoolCategory(
      otherSchoolCategories: string[],
      newCategory: string | undefined,
      groupCategory: string | undefined,
      previousCategory?: string,
      otherMemberIds: string[] = [],
    ) {
      const school = createSchool(previousCategory);
      const otherSchools = otherSchoolCategories.map(createSchool);
      const group = new CommonValueGroup();
      group.members = [school, ...otherSchools]
        .map((s) => s.getId())
        .concat(otherMemberIds);
      group.category = groupCategory;
      entityMapper.addAll([school, ...otherSchools, group]);

      const schoolBefore = school.copy();
      school.category = categoryOf(newCategory);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(school, schoolBefore);
    }

    it.each([
      // other parents, changed parent, record before, suggested value, note, changed parent before
      [["primary", "primary"], "primary", "secondary", "primary", undefined],
      [[undefined], "primary", undefined, "primary", undefined],
      [[undefined], undefined, "primary", undefined, undefined, "primary"],
      [["secondary"], "primary", "secondary", "secondary", "conflict"],
    ])(
      "suggests the value that all parents have in common to the record (others %j, changed %s, record %s): %s, note %s",
      async (others, changed, current, expected, note, previous) => {
        await saveSchoolCategory(others, changed, current, previous);

        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        const suggestion = suggestionForGroup();
        expect(suggestion.newValue).toBe(expected);
        expect(suggestion.noCommonValue).toBe(note);
      },
    );

    describe("when some of the parents cannot be loaded", () => {
      let warn: MockInstance;

      beforeEach(() => {
        warn = vi.spyOn(Logging, "warn").mockReturnValue(undefined);
      });

      afterEach(() => {
        warn.mockRestore();
      });

      it.each([
        ["the user may not read it", { status: 403 }, false],
        ["it is missing", { status: 404 }, true],
      ])(
        "keeps the current value of the record if a parent cannot be loaded because %s, reporting only unexpected failures",
        async (_, loadError, reported) => {
          failLoadingOf("School:not-accessible", loadError);

          await saveSchoolCategory([], "primary", "secondary", "secondary", [
            "School:not-accessible",
          ]);

          const suggestion = suggestionForGroup();
          expect(suggestion.newValue).toBe("secondary");
          expect(suggestion.noCommonValue).toBe("unavailable");
          expect(warn).toHaveBeenCalledTimes(reported ? 1 : 0);
        },
      );
    });

    it("does not save the record again if the dialog is confirmed without a change of its value", async () => {
      const saveSpy = vi.spyOn(entityMapper, "saveAll");

      await saveSchoolCategory(["secondary"], "primary", "secondary");

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      expect(
        saveSpy.mock.calls
          .flatMap(([entities]) => entities)
          .some((e) => e instanceof CommonValueGroup),
      ).toBe(false);
    });

    it.each([
      [["secondary"], "primary", undefined],
      [["primary"], "primary", "primary"],
    ])(
      "does not offer an update of the record if there is no value to suggest or keep, or it has the common value already (others %j, changed %s, record %s)",
      async (others, changed, current) => {
        await saveSchoolCategory(others, changed, current);

        const updatedEntities = mockDialog.open.mock.calls.flatMap(
          (call) => call[1].data.entities,
        );
        expect(
          updatedEntities.some((e) => e.targetEntityType === CommonValueGroup),
        ).toBe(false);
      },
    );
  });

  describe("across several hierarchy levels", () => {
    function createAction(tags: string[], ...parents: HierarchyAction[]) {
      const action = new HierarchyAction();
      action.tags = toTags(tags);
      action.parents = parents.map((parent) => parent.getId());
      action._rev = "1-existing";
      return action;
    }

    /** change the tags of the action (which has to be added to the database) and return the suggestions of the dialog */
    async function changeTags(
      action: HierarchyAction,
      tagsAfter: string[],
      actionBefore = action.copy(),
    ) {
      action.tags = toTags(tagsAfter);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(action, actionBefore);

      return (
        mockDialog.open.mock.calls[0]?.[1].data.entities.map((e) => [
          e.id,
          e.newValue,
          e.level,
          e.via,
        ]) ?? []
      );
    }

    it("suggests the new values for the parent and the parent of the parent", async () => {
      const project = createAction(["health"]);
      const workPackage = createAction(["health"], project);
      const activity = createAction([], workPackage);
      entityMapper.addAll([project, workPackage, activity]);

      const suggestions = await changeTags(activity, ["education"]);

      expect(suggestions).toEqual([
        [workPackage.getId(), ["health", "education"], 1, [activity.getId()]],
        [project.getId(), ["health", "education"], 2, [workPackage.getId()]],
      ]);
    });

    it("bases the entities above on the changed field of the changed record, also if each level passes on another field", async () => {
      const project = new FieldChainAction();
      const workPackage = new FieldChainAction();
      workPackage.parent = project.getId();
      const activity = new FieldChainAction();
      activity.parent = workPackage.getId();
      [project, workPackage, activity].forEach(
        (action) => (action._rev = "1-existing"),
      );
      entityMapper.addAll([project, workPackage, activity]);
      const activityBefore = activity.copy();
      activity.lowerTags = toTags(["health"]);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(activity, activityBefore);

      expect(
        mockDialog.open.mock.calls[0][1].data.entities.map((e) => [
          e.id,
          e.targetFieldId,
          e.sourceFieldId,
        ]),
      ).toEqual([
        [workPackage.getId(), "middleTags", "lowerTags"],
        [project.getId(), "upperTags", "lowerTags"],
      ]);
    });

    it("saves the confirmed values of the entities above in entity format", async () => {
      const project = createAction([]);
      const activity = createAction([], project);
      entityMapper.addAll([project, activity]);

      await changeTags(activity, ["health", "education"]);

      const savedProject = await entityMapper.load(
        HierarchyAction,
        project.getId(),
      );
      expect(savedProject.tags).toEqual(toTags(["health", "education"]));
    });

    it("also offers the fields of the changed record that are based on the changed values above, but not the field that was changed", async () => {
      const project = new CycleAction();
      const activity = new CycleAction();
      const otherActivity = new CycleAction();
      [activity, otherActivity].forEach((action) => {
        action.parent = project.getId();
        action.value = [];
        action.inheritedTotal = [];
      });
      [project, activity, otherActivity].forEach(
        (action) => (action._rev = "1-existing"),
      );
      entityMapper.addAll([project, activity, otherActivity]);
      const activityBefore = activity.copy();
      activity.value = toTags(["health"]);
      mockDialog.open.mockClear();

      await service.applyRulesToDependentEntities(activity, activityBefore);

      const offered = mockDialog.open.mock.calls[0][1].data.entities.map(
        (e) => `${e.id}|${e.targetFieldId}`,
      );
      expect(offered.sort()).toEqual(
        [
          `${project.getId()}|total`,
          `${otherActivity.getId()}|value`,
          `${otherActivity.getId()}|inheritedTotal`,
          `${activity.getId()}|inheritedTotal`,
        ].sort(),
      );
    });

    describe("when the changed record passes a value down to its sub-records, which pass it up again", () => {
      let project: FanOutAction;

      /** change the main tag of a project with several activities, which have the old main tag */
      async function changeMainTag(dialogResult?: () => unknown) {
        project = new FanOutAction();
        project.mainTag = toTagValue("health");
        project.subTags = toTags(["health"]);
        const activities = Array.from({ length: 5 }, () => {
          const activity = new FanOutAction();
          activity.parent = project.getId();
          activity.tag = toTagValue("health");
          return activity;
        });
        [project, ...activities].forEach(
          (action) => (action._rev = "1-existing"),
        );
        entityMapper.addAll([project, ...activities]);
        const projectBefore = project.copy();
        project.mainTag = toTagValue("education");
        mockDialog.open.mockClear();
        if (dialogResult) {
          mockDialog.open.mockImplementationOnce(() => ({
            afterClosed: () => of(dialogResult()),
          }));
        }
        mockIndexing.queryIndexDocs.mockClear();

        await service.applyRulesToDependentEntities(project, projectBefore);

        return mockDialog.open.mock.calls[0][1].data.entities;
      }

      it("loads the sub-records of a record only once, also if each of its changed sub-records updates it", async () => {
        const suggestions = await changeMainTag();

        expect(
          suggestions.find((e) => e.targetFieldId === "subTags").newValue,
        ).toEqual(["education"]);
        expect(
          mockIndexing.queryIndexDocs.mock.calls.filter(
            ([, , key]) => key === project.getId(),
          ),
        ).toHaveLength(1);
      });

      it("does not set the suggested value of a field of the changed record before the user confirms it", async () => {
        await changeMainTag(() => undefined);

        expect(project.subTags).toEqual(toTags(["health"]));
      });
    });

    it("stops at the level where nothing changes", async () => {
      const project = createAction(["health", "education"]);
      const workPackage = createAction(["health"], project);
      const activity = createAction([], workPackage);
      entityMapper.addAll([project, workPackage, activity]);

      const suggestions = await changeTags(activity, ["education"]);

      expect(suggestions.map(([id]) => id)).toEqual([workPackage.getId()]);
    });

    it("lists a parent reached over several branches once, with all the records it is reached from", async () => {
      const district = createAction(["health"]);
      const school1 = createAction(["health"], district);
      const school2 = createAction(["health"], district);
      const child = createAction([], school1, school2);
      entityMapper.addAll([district, school1, school2, child]);

      const suggestions = await changeTags(child, ["education"]);

      expect(suggestions).toEqual([
        [school1.getId(), ["health", "education"], 1, [child.getId()]],
        [school2.getId(), ["health", "education"], 1, [child.getId()]],
        [
          district.getId(),
          ["health", "education"],
          2,
          [school1.getId(), school2.getId()],
        ],
      ]);
    });

    it("does not offer an update for the changed record itself if the links form a loop", async () => {
      const a = createAction(["health"]);
      const b = createAction(["health"], a);
      a.parents = [b.getId()];
      entityMapper.addAll([a, b]);

      const suggestions = await changeTags(a, ["health", "education"]);

      expect(suggestions.map(([id]) => id)).toEqual([b.getId()]);
    });

    it("stops after a maximum number of levels", async () => {
      let parent: HierarchyAction | undefined;
      const chain: HierarchyAction[] = [];
      for (let i = 0; i < 14; i++) {
        parent = createAction(["health"], ...(parent ? [parent] : []));
        chain.unshift(parent);
      }
      entityMapper.addAll(chain);

      const suggestions = await changeTags(chain[0], ["education"]);

      expect(suggestions).toHaveLength(10);
      expect(suggestions.at(-1)[2]).toBe(10);
    });

    it("only lists the levels that can be loaded", async () => {
      const unknownParent = new HierarchyAction("unknown");
      const parent = createAction(["health"], unknownParent);
      const child = createAction([], parent);
      entityMapper.addAll([parent, child]);

      const suggestions = await changeTags(child, ["education"]);

      expect(suggestions.map(([id]) => id)).toEqual([parent.getId()]);
    });

    it("removes a value from the parent of the parent if no record below it keeps the value", async () => {
      const project = createAction(["education"]);
      const workPackage = createAction(["education"], project);
      const activity = createAction(["education"], workPackage);
      entityMapper.addAll([project, workPackage, activity]);

      const suggestions = await changeTags(activity, []);

      expect(suggestions).toEqual([
        [workPackage.getId(), [], 1, [activity.getId()]],
        [project.getId(), [], 2, [workPackage.getId()]],
      ]);
    });

    it("keeps a value of the parent of the parent that another record below it still has", async () => {
      const project = createAction(["education"]);
      const workPackage1 = createAction(["education"], project);
      const workPackage2 = createAction(["education"], project);
      const activity = createAction(["education"], workPackage1);
      entityMapper.addAll([project, workPackage1, workPackage2, activity]);

      const suggestions = await changeTags(activity, []);

      expect(suggestions.map(([id]) => id)).toEqual([workPackage1.getId()]);
    });

    it("removes a value from the parent of the parent once all records below it that had it are updated", async () => {
      const project = createAction(["education"]);
      const workPackage1 = createAction(["education"], project);
      const workPackage2 = createAction(["education"], project);
      const activity = createAction(["education"], workPackage1, workPackage2);
      entityMapper.addAll([project, workPackage1, workPackage2, activity]);

      const suggestions = await changeTags(activity, []);

      expect(suggestions.map(([id, value]) => [id, value])).toEqual([
        [workPackage1.getId(), []],
        [workPackage2.getId(), []],
        [project.getId(), []],
      ]);
    });

    it("removes a value from the parent of the parent that one branch below it drops while another branch only adds values", async () => {
      const project = createAction(["water", "health"]);
      const workPackage1 = createAction(["water"], project);
      const workPackage2 = createAction(["health"], project);
      const activity = createAction(["water"], workPackage1);
      entityMapper.addAll([project, workPackage1, workPackage2, activity]);
      const activityBefore = activity.copy();
      activity.parents = [workPackage2.getId()];

      const suggestions = await changeTags(
        activity,
        ["education"],
        activityBefore,
      );

      expect(suggestions.map(([id, value]) => [id, value])).toEqual([
        [workPackage2.getId(), ["health", "education"]],
        [workPackage1.getId(), []],
        [project.getId(), ["health", "education"]],
      ]);
    });

    it("does not offer a record the user may not update, nor the records above it", async () => {
      const project = createAction(["health"]);
      const workPackage = createAction(["health"], project);
      const activity = createAction([], workPackage);
      entityMapper.addAll([project, workPackage, activity]);
      ability.can.mockImplementation(
        (action: string, entity: Entity) =>
          entity.getId() !== workPackage.getId(),
      );

      const suggestions = await changeTags(activity, ["education"]);

      expect(suggestions).toEqual([]);
    });

    it("suggests the shared value to a record linking to several updated parents", async () => {
      const workPackage1 = createAction(["health"]);
      const workPackage2 = createAction(["health"]);
      const activity = createAction([], workPackage1, workPackage2);
      const group = new HierarchyGroup();
      group.members = [workPackage1.getId(), workPackage2.getId()];
      group.tags = toTags(["health"]);
      entityMapper.addAll([workPackage1, workPackage2, activity, group]);

      await changeTags(activity, ["education"]);

      const suggestion = mockDialog.open.mock.calls[0][1].data.entities.find(
        (e) => e.id === group.getId(),
      );
      expect(suggestion.newValue).toEqual(["health", "education"]);
      expect(suggestion.noCommonValue).toBeUndefined();
    });

    it("also covers the levels above when updating the linked records from the field button", async () => {
      const project = createAction(["health"]);
      const workPackage = createAction(["health"], project);
      const activity = createAction(["education"], workPackage);
      entityMapper.addAll([project, workPackage, activity]);
      mockDialog.open.mockClear();

      await service.updateLinkedRecords(activity, "tags");

      expect(
        mockDialog.open.mock.calls[0][1].data.entities.map((e) => e.id),
      ).toEqual([workPackage.getId(), project.getId()]);
    });

    describe("changes of several records at once", () => {
      /** change the tags of all the actions (which have to be added to the database) and return the data of the dialog */
      async function changeAllTags(
        actions: HierarchyAction[],
        tagsAfter: string[],
      ) {
        const before = actions.map((action) => action.copy());
        actions.forEach((action) => (action.tags = toTags(tagsAfter)));
        mockDialog.open.mockClear();

        await service.applyRulesToDependentEntities(actions, before);

        return mockDialog.open.mock.calls[0]?.[1].data;
      }

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("lists a record that several changed records link to once, based on the values of all of them", async () => {
        const workPackage = createAction(["health", "education"]);
        const activity1 = createAction(["health"], workPackage);
        const activity2 = createAction(["health"], workPackage);
        const activity3 = createAction(["education"], workPackage);
        entityMapper.addAll([workPackage, activity1, activity2, activity3]);

        const data = await changeAllTags([activity1, activity2], ["water"]);

        expect(data.entities.map((e) => [e.id, e.newValue, e.via])).toEqual([
          [
            workPackage.getId(),
            ["education", "water"],
            [activity1.getId(), activity2.getId()],
          ],
        ]);
      });

      it("calculates a record that many changed records link to only until its value settles, not again for each of them", async () => {
        const workPackage = createAction(["health"]);
        const activities = Array.from({ length: 20 }, () =>
          createAction(["health"], workPackage),
        );
        entityMapper.addAll([workPackage, ...activities]);
        const collectValues = vi.spyOn(service, "collectValues");

        await changeAllTags(activities, ["water"]);

        expect(collectValues.mock.calls.length).toBeLessThan(activities.length);
      });

      it("calculates a record again when another record linking to it gets a new value later", async () => {
        const project = createAction(["health"]);
        const workPackage1 = createAction(["health"], project);
        const workPackage2 = createAction(["health"], project);
        const activity = createAction(["health"], workPackage1);
        entityMapper.addAll([project, workPackage1, workPackage2, activity]);
        const before = [workPackage2.copy(), activity.copy()];
        // the project is calculated from the second work package before the first one gets the new value of the activity
        workPackage2.tags = toTags(["water"]);
        activity.tags = toTags(["education"]);
        mockDialog.open.mockClear();

        await service.applyRulesToDependentEntities(
          [workPackage2, activity],
          before,
        );

        const projectRow = mockDialog.open.mock.calls[0][1].data.entities.find(
          (e) => e.id === project.getId(),
        );
        expect([...projectRow.newValue].sort()).toEqual(["education", "water"]);
      });

      it("keeps the value that the change set on a record that another changed record passes its value to", async () => {
        const project = new MappedStatusAction();
        const activity = new MappedStatusAction();
        activity.parent = project.getId();
        [project, activity].forEach((action) => (action._rev = "1-existing"));
        entityMapper.addAll([project, activity]);
        const before = [project.copy(), activity.copy()];
        project.status = "planned";
        activity.status = "planned";
        mockDialog.open.mockClear();

        await service.applyRulesToDependentEntities(
          [project, activity],
          before,
        );

        expect(mockDialog.open).not.toHaveBeenCalled();
      });

      it("reaches the levels above also if more records changed than the calculation takes steps at most", async () => {
        const project = createAction(["health"]);
        const workPackage = createAction(["health"], project);
        const activities = Array.from({ length: 1001 }, () =>
          createAction(["health"], workPackage),
        );
        entityMapper.addAll([project, workPackage, ...activities]);

        const data = await changeAllTags(activities, ["water"]);

        expect(data.entities.map((e) => [e.id, e.newValue])).toEqual([
          [workPackage.getId(), ["water"]],
          [project.getId(), ["water"]],
        ]);
      });

      it("returns the updated records as they were before the update, so that it can be undone", async () => {
        const workPackage = createAction(["health"]);
        const activity1 = createAction(["health"], workPackage);
        const activity2 = createAction(["health"], workPackage);
        entityMapper.addAll([workPackage, activity1, activity2]);
        const before = [activity1.copy(), activity2.copy()];
        activity1.tags = toTags(["water"]);
        activity2.tags = toTags(["water"]);

        const previousVersions = await service.applyRulesToDependentEntities(
          [activity1, activity2],
          before,
        );

        expect(
          previousVersions.map((record) => [record.getId(), record["tags"]]),
        ).toEqual([[workPackage.getId(), toTags(["health"])]]);
        const saved = await entityMapper.load(
          HierarchyAction,
          workPackage.getId(),
        );
        expect(saved.tags).toEqual(toTags(["water"]));
      });

      it("reports a failure to update the linked records and tells the user, without failing the save of the changed records", async () => {
        const workPackage = createAction(["health"]);
        const activity = createAction(["health"], workPackage);
        entityMapper.addAll([workPackage, activity]);
        const before = activity.copy();
        activity.tags = toTags(["water"]);
        const error = new Error("Failed to fetch dynamically imported module");
        mockDialog.open.mockImplementationOnce(() => {
          throw error;
        });
        const logError = vi
          .spyOn(Logging, "error")
          .mockImplementation(() => {});
        alertService.addDanger.mockClear();

        const previousVersions = await service.applyRulesToDependentEntities(
          [activity],
          [before],
        );

        expect(previousVersions).toEqual([]);
        expect(logError).toHaveBeenCalledWith(expect.any(String), error);
        expect(alertService.addDanger).toHaveBeenCalledOnce();
      });

      it("does not return a changed record that the update changed again, as the caller has it from before its change", async () => {
        const project = new CycleAction();
        const activity = new CycleAction();
        const otherActivity = new CycleAction();
        [activity, otherActivity].forEach((action) => {
          action.parent = project.getId();
          action.value = [];
          action.inheritedTotal = [];
        });
        [project, activity, otherActivity].forEach(
          (action) => (action._rev = "1-existing"),
        );
        entityMapper.addAll([project, activity, otherActivity]);
        const activityBefore = activity.copy();
        activity.value = toTags(["health"]);

        const previousVersions = await service.applyRulesToDependentEntities(
          [activity],
          [activityBefore],
        );

        expect(previousVersions.map((record) => record.getId()).sort()).toEqual(
          [project.getId(), otherActivity.getId()].sort(),
        );
      });

      it("does not return a given record that the update changed, also if its own change is not passed on", async () => {
        const parent = new FieldChainAction();
        parent.lowerTags = toTags(["water"]);
        parent.middleTags = toTags(["health"]);
        const child = new FieldChainAction();
        child.parent = parent.getId();
        child.lowerTags = toTags(["health"]);
        [parent, child].forEach((action) => (action._rev = "1-existing"));
        entityMapper.addAll([parent, child]);
        const before = [parent.copy(), child.copy()];
        // e.g. a bulk edit of both, where the parent already had the value
        child.lowerTags = toTags(["water"]);

        const previousVersions = await service.applyRulesToDependentEntities(
          [parent, child],
          before,
        );

        const saved = await entityMapper.load(FieldChainAction, parent.getId());
        expect(saved.middleTags).toEqual(toTags(["water"]));
        expect(previousVersions).toEqual([]);
      });

      it("passes only the records whose change is passed on to the dialog", async () => {
        const workPackage = createAction(["health", "water"]);
        const changed = createAction(["health"], workPackage);
        const unchanged = createAction(["water"], workPackage);
        entityMapper.addAll([workPackage, changed, unchanged]);
        const before = [changed.copy(), unchanged.copy()];
        changed.tags = toTags(["water"]);
        // saving gives each record a new revision and update time, also if its value is the same
        for (const action of [changed, unchanged]) {
          action._rev = "2-saved";
          action.updated = Object.assign(new UpdateMetadata(), {
            at: new Date(),
            by: "user",
          });
        }
        mockDialog.open.mockClear();

        await service.applyRulesToDependentEntities(
          [changed, unchanged],
          before,
        );

        expect(
          mockDialog.open.mock.calls[0][1].data.triggers.map((t) =>
            t.entity.getId(),
          ),
        ).toEqual([changed.getId()]);
      });
    });
  });
});
