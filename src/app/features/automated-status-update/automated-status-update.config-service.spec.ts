import { TestBed } from "@angular/core/testing";
import { AutomatedStatusUpdateConfigService } from "./automated-status-update-config-service";
import { MatDialog } from "@angular/material/dialog";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { of } from "rxjs";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { DefaultValueMode } from "../../core/default-values/default-value-config";

const mockAutomationConfig = {
  mode: "inherited-field" as DefaultValueMode,
  config: {
    sourceEntityType: "Mentorship",
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

describe("AutomatedStatusUpdateConfigService", () => {
  let entityMapper: MockEntityMapperService;
  let service: AutomatedStatusUpdateConfigService;
  let enumService: jasmine.SpyObj<ConfigurableEnumService>;

  const TEST_MENTORSHIP_ENUM: ConfigurableEnumValue[] = [
    { id: "active", label: "Active" },
    { id: "finished", label: "Finished" },
  ];

  const TEST_SCHOOL_ENUM: ConfigurableEnumValue[] = [
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
  ];

  const mockDialogRef = {
    afterClosed: () => of(null),
  };
  const mockDialog = jasmine.createSpyObj<MatDialog>("MatDialog", ["open"]);
  mockDialog.open.and.returnValue(mockDialogRef as any);

  beforeEach(() => {
    enumService = jasmine.createSpyObj<ConfigurableEnumService>([
      "getEnumValues",
      "preLoadEnums",
    ]);
    enumService.getEnumValues.and.callFake(
      <T extends ConfigurableEnumValue = ConfigurableEnumValue>(
        enumName: string,
      ): T[] => {
        if (enumName === "mentorship-status-enum")
          return TEST_MENTORSHIP_ENUM as T[];
        if (enumName === "school-category-enum") return TEST_SCHOOL_ENUM as T[];
        return [] as T[];
      },
    );

    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider(),
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: jasmine
              .createSpy("valueToEntityFormat")
              .and.callFake((_field, value) => value),
          },
        },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: ConfigurableEnumService, useValue: enumService },
      ],
    });
    service = TestBed.inject(AutomatedStatusUpdateConfigService);

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;

    entityRegistry.set("Child", Child);
    entityRegistry.set("School", School);
    entityRegistry.set("Mentee", Mentee);
    entityRegistry.set("Mentorship", Mentorship);
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
    originalMentorship.status = undefined;

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
});
