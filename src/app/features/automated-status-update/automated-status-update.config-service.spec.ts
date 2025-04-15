import { TestBed } from "@angular/core/testing";
import { AutomatedStatusUpdateConfigService } from "./automated-status-update-config-service";
import { MatDialog } from "@angular/material/dialog";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import {
  DatabaseEntity,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { of } from "rxjs";
import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { DefaultValueMode } from "app/core/entity/schema/default-value-config";

const mockAutomnatedConfig = {
  mode: "AutomatedConfigRule" as DefaultValueMode,
  automatedConfigRule: [
    {
      relatedEntity: "Mentorship",
      relatedField: "status",
      mappedProperty: "mentee",
      automatedMapping: {
        active: "in-mentorship",
        finished: "open for mentorship",
      },
    },
  ],
};
@DatabaseEntity("Mentee")
class Mentee extends Entity {
  @DatabaseField()
  name!: string;
  @DatabaseField({
    defaultValue: mockAutomnatedConfig,
  })
  status: string;
}

@DatabaseEntity("Mentorship")
class Mentorship extends Entity {
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "test-enum",
  })
  status: ConfigurableEnumValue;
  @DatabaseField()
  mentee!: string;
  @DatabaseField()
  otherField!: string;
}

describe("AutomatedStatusUpdateConfigService", () => {
  let entityMapper: MockEntityMapperService;
  let mentee: Mentee;
  let mentorship: Mentorship;
  let service: AutomatedStatusUpdateConfigService;

  const TEST_CONFIG: ConfigurableEnumConfig = [
    { id: "active", label: "Active" },
    { id: "finished", label: "Finished" },
  ];

  let enumService: jasmine.SpyObj<ConfigurableEnumService>;

  const mockDialogRef = {
    afterClosed: () => of(null),
  };
  const mockDialog = jasmine.createSpyObj<MatDialog>("MatDialog", ["open"]);
  mockDialog.open.and.returnValue(mockDialogRef as any);

  beforeEach(() => {
    enumService = jasmine.createSpyObj([
      "getEnumValues",
      "preLoadEnums",
      "cacheEnum",
    ]);
    enumService.getEnumValues.and.returnValue(TEST_CONFIG);
    entityMapper = mockEntityMapper();

    mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";
    mentee.getSchema();

    mentorship = new Mentorship();
    mentorship.status = TEST_CONFIG[1];
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentee, mentorship]);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
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
  });

  it("should update mentee status when status of linked mentorship changes", async () => {
    mentorship.status = TEST_CONFIG[1];
    const changedFields = { status: TEST_CONFIG[1] };
    await service.applyRulesToDependentEntities(mentorship, changedFields);

    const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(updatedMentee.status).toBe("open for mentorship");
  });

  it("should not change mentee status when other field of mentorship changes", async () => {
    mentorship.otherField = "updated value";
    const changedFields = { otherField: "updated value" };

    await service.applyRulesToDependentEntities(mentorship, changedFields);

    const currentMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(currentMentee.status).toBe("open for mentorship");
  });

  it("should not update mentee status if status of mentorship linking to different mentee changes", async () => {
    const otherMentee = new Mentee();
    otherMentee.name = "Mentee B";
    otherMentee.status = "open for mentorship";
    entityMapper.add(otherMentee);

    const otherMentorship = new Mentorship();
    otherMentorship.status = TEST_CONFIG[1];
    otherMentorship.mentee = otherMentee.getId();
    entityMapper.add(otherMentorship);

    const changedFields = { status: "finished" };
    await service.applyRulesToDependentEntities(otherMentorship, changedFields);

    const originalMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(originalMentee.status).toBe("open for mentorship");
  });
});
