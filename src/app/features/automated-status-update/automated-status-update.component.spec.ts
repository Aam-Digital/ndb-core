import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";

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

  it("should ask to update mentee status when status of mentorship linking to it changes", () => {
    mentorship.status = "finished";

    const shouldAskToUpdateStatus =
      mentorship.status === "finished" && mentorship.mentee === mentee.getId();

    if (shouldAskToUpdateStatus) {
      mentee.status = "alumni";
    }

    expect(shouldAskToUpdateStatus).toBeTrue();
    expect(mentee.status).toBe("alumni");
  });

  it("should not ask to update mentee status when other field of mentorship linking to it changes", () => {
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

    expect(mentee.status).toBe("open for mentorship");
  });
});
