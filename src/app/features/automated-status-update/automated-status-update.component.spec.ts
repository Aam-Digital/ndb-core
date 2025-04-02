import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";
import { DefaultValueConfig } from "app/core/entity/schema/default-value-config";

const menteeStatusDefaultConfig: DefaultValueConfig = {
  mode: "AutomatedConfigRule",
  automatedConfigRule: [
    {
      relatedEntity: "Mentorship",
      relatedField: "status",
      automatedMapping: {
        active: "in mentorship",
        finished: "alumni",
      },
    },
  ],
};

@DatabaseEntity("Mentor")
class Mentor extends Entity {
  @DatabaseField()
  name!: string;
}

@DatabaseEntity("Mentee")
class Mentee extends Entity {
  @DatabaseField()
  name!: string;
  @DatabaseField()
  status!: string;

  applyDefaultValueConfig(config: DefaultValueConfig, mentorship: Mentorship) {
    config.automatedConfigRule.forEach((rule) => {
      if (
        rule.relatedEntity === "Mentorship" &&
        rule.relatedField === "status"
      ) {
        this.status = rule.automatedMapping[mentorship.status] || this.status;
      }
    });
  }
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

fdescribe("Mentorship Status Updates", () => {
  let entityMapper: MockEntityMapperService;
  let mentor: Mentor;
  let mentee: Mentee;
  let mentorship: Mentorship;

  beforeEach(() => {
    entityMapper = mockEntityMapper();

    mentor = new Mentor();
    mentor.name = "Mentor A";

    mentee = new Mentee();
    mentee.name = "Mentee A";
    mentee.status = "open for mentorship";

    mentorship = new Mentorship();
    mentorship.status = "active";
    mentorship.mentee = mentee.getId();

    entityMapper.addAll([mentor, mentee, mentorship]);

    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
  });

  it("should update mentee status when mentorship status changes", () => {
    mentorship.status = "finished";

    const shouldAskToUpdateStatus =
      mentorship.status === "finished" && mentorship.mentee === mentee.getId();
    if (shouldAskToUpdateStatus) {
      mentee.applyDefaultValueConfig(menteeStatusDefaultConfig, mentorship);
    }

    expect(shouldAskToUpdateStatus).toBeTrue();
    expect(mentee.status).toBe("alumni");
  });

  it("should not change mentee status when other field of mentorship changes", () => {
    mentorship.otherField = "updated value";
    expect(mentee.status).toBe("open for mentorship");
  });

  it("should not ask to update mentee status if status of mentorship linking to different mentee changes", () => {
    let otherMentee = new Mentee();
    otherMentee.name = "Mentee B";
    otherMentee.status = "open for mentorship";

    let otherMentorship = new Mentorship();
    otherMentorship.status = "finished";
    otherMentorship.mentee = otherMentee.getId();

    otherMentee.applyDefaultValueConfig(
      menteeStatusDefaultConfig,
      otherMentorship,
    );

    expect(mentee.status).toBe("open for mentorship");
  });
});
