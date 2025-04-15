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

@DatabaseEntity("Mentee")
class Mentee extends Entity {
  @DatabaseField()
  name!: string;
  @DatabaseField()
  status!: string;
}

@DatabaseEntity("Mentorship")
class Mentorship extends Entity {
  @DatabaseField()
  status!: string;
  @DatabaseField()
  mentee!: string;
  @DatabaseField()
  otherField!: string;
}
fdescribe("AutomatedStatusUpdateConfigService", () => {
  let entityMapper: MockEntityMapperService;
  let mentee: Mentee;
  let mentorship: Mentorship;
  let service: AutomatedStatusUpdateConfigService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  const mockDialogRef = {
    afterClosed: () => of(true), // Auto-confirm dialog
  };

  mockDialog = jasmine.createSpyObj<MatDialog>("MatDialog", ["open"]);
  mockDialog.open.and.returnValue(mockDialogRef as any);
  beforeEach(() => {
    mockDialog = jasmine.createSpyObj(["open"]);
    entityMapper = mockEntityMapper();

    mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";

    mentorship = new Mentorship();
    mentorship.status = "active";
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentee, mentorship]);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ConfigurableEnumService, useValue: {} },
        { provide: EntitySchemaService, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });
    service = TestBed.inject(AutomatedStatusUpdateConfigService);
  });

  it("should update mentee status when status of linked mentorship changes", async () => {
    // Initial setup
    const originalMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(originalMentee.status).toBe("open for mentorship");

    // Trigger change
    const changedFields = { status: "finished" };
    mentorship.status = "finished";

    // Execute service flow
    await service.applyRulesToDependentEntities(mentorship, changedFields);

    // Verify dialog was called
    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    entityMapper.save(mentee);
    // Verify actual save
    const updatedMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(updatedMentee.status).toBe("alumni");
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
    otherMentorship.status = "finished";
    otherMentorship.mentee = otherMentee.getId();
    entityMapper.add(otherMentorship);

    const changedFields = { status: "finished" };
    await service.applyRulesToDependentEntities(otherMentorship, changedFields);

    const originalMentee = await entityMapper.load(Mentee, mentee.getId());
    expect(originalMentee.status).toBe("open for mentorship");
  });
});
