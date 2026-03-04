import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { RollCallComponent } from "./roll-call.component";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { By } from "@angular/platform-browser";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { SimpleChange } from "@angular/core";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { AttendanceItem } from "../../model/attendance-item";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Location } from "@angular/common";
import { AttendanceService } from "../../attendance.service";

const PRESENT = {
  id: "PRESENT",
  shortName: "P",
  label: "Present",
  style: "attendance-P",
  countAs: AttendanceLogicalStatus.PRESENT,
};
const ABSENT = {
  id: "ABSENT",
  shortName: "A",
  label: "Absent",
  style: "attendance-A",
  countAs: AttendanceLogicalStatus.ABSENT,
};

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  let participant1: TestEntity,
    participant2: TestEntity,
    participant3: TestEntity;

  const dummyChanges = {
    eventEntity: new SimpleChange(undefined, {}, true),
  };

  function addParticipant(note: Note, participant: Entity | string) {
    const id =
      typeof participant === "string" ? participant : participant.getId();
    note.children.push(id);
    note.childrenAttendance.push(new AttendanceItem(undefined, "", id));
  }

  beforeEach(waitForAsync(() => {
    participant1 = new TestEntity("child1");
    participant2 = new TestEntity("child2");
    participant3 = new TestEntity("child3");

    TestBed.configureTestingModule({
      imports: [
        RollCallComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          participant1,
          participant2,
          participant3,
        ]),
      ],
      providers: [
        { provide: ChildrenService, useValue: {} },
        {
          provide: AttendanceService,
          useValue: {
            createEventForActivity: () => Promise.resolve(new Note()),
            getEventsOnDate: () => Promise.resolve([]),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    component.eventEntity = Note.create(new Date());
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available attendance status to select", async () => {
    const options = [PRESENT, ABSENT];
    const enumService = TestBed.inject(ConfigurableEnumService);
    spyOn(enumService, "getEnumValues").and.returnValue(options);
    addParticipant(component.eventEntity, participant1);
    await component.ngOnChanges(dummyChanges);
    fixture.detectChanges();
    await fixture.whenStable();

    const statusOptions = fixture.debugElement.queryAll(
      By.css(".group-select-option"),
    );
    expect(statusOptions).toHaveSize(options.length);
  });

  it("should not record attendance if childId does not exist", fakeAsync(() => {
    const nonExistingChildId = "notExistingChild";
    const noteWithNonExistingChild = new Note();
    addParticipant(noteWithNonExistingChild, participant1);
    addParticipant(noteWithNonExistingChild, nonExistingChildId);
    component.eventEntity = noteWithNonExistingChild;

    component.ngOnChanges(dummyChanges);
    tick();

    expect(component.participants).toEqual([participant1]);
    expect(component.eventEntity.children).not.toContain(nonExistingChildId);
    expect(
      component.eventEntity.childrenAttendance.some(
        (a) => a.participant === nonExistingChildId,
      ),
    ).toBeFalse();
    flush();
  }));

  it("should correctly assign the attendance", fakeAsync(() => {
    const note = new Note("noteWithAttendance");
    addParticipant(note, participant1);
    addParticipant(note, participant2);

    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    component.markAttendance(PRESENT);
    tick(1000);
    component.markAttendance(ABSENT);

    expect(
      note.childrenAttendance.find(
        (a) => a.participant === participant1.getId(),
      ).status,
    ).toEqual(PRESENT);
    expect(
      note.childrenAttendance.find(
        (a) => a.participant === participant2.getId(),
      ).status,
    ).toEqual(ABSENT);
    flush();
  }));

  it("should save event when all existing children are finished", fakeAsync(() => {
    const note = new Note();
    addParticipant(note, participant1);
    addParticipant(note, "notExistingChild");
    addParticipant(note, participant2);

    const saveSpy = spyOn(TestBed.inject(EntityMapperService), "save");
    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    component.goToParticipantWithIndex(component.currentIndex + 1);
    component.goToParticipantWithIndex(component.currentIndex + 1);

    expect(saveSpy).toHaveBeenCalledWith(note);
  }));

  it("should navigate back to overview when finish is called", () => {
    const location = TestBed.inject(Location);
    spyOn(location, "back");

    component.finish();

    expect(location.back).toHaveBeenCalled();
  });

  it("isn't dirty initially", () => {
    expect(component.isDirty).toBeFalse();
  });

  it("isn't dirty when the user has skipped participants", async () => {
    const event = new Note();
    addParticipant(event, participant1.getId());
    addParticipant(event, participant2.getId());
    event.date = new Date();
    event.subject = "test";
    component.eventEntity = event;
    await component.ngOnChanges(dummyChanges);

    component.goToParticipantWithIndex(component.currentIndex + 1);
    component.goToParticipantWithIndex(component.currentIndex + 1);
    component.goToParticipantWithIndex(component.currentIndex - 1);
    expect(component.isDirty).toBeFalse();
  });

  it("is dirty when the user has entered some attendance", async () => {
    const event = new Note();
    addParticipant(event, participant1.getId());
    event.date = new Date();
    event.subject = "test";
    component.eventEntity = event;
    await component.ngOnChanges(dummyChanges);

    component.markAttendance(undefined);
    expect(component.isDirty).toBeTrue();
  });

  it("starts with the initial child if no attendance has been registered", async () => {
    addParticipant(component.eventEntity, participant1);
    await component.ngOnChanges(dummyChanges);

    expect(component.currentIndex).toBe(0);
    expect(component.currentParticipant).toBe(participant1);
  });

  it("starts with the first child that doesn't have an attendance status set", async () => {
    for (const child of [participant1, participant2, participant3]) {
      addParticipant(component.eventEntity, child);
    }
    component.eventEntity.childrenAttendance.find(
      (a) => a.participant === participant1.getId(),
    ).status = PRESENT;
    component.eventEntity.childrenAttendance.find(
      (a) => a.participant === participant3.getId(),
    ).status = ABSENT;
    await component.ngOnChanges(dummyChanges);
    expect(component.currentParticipant).toBe(participant2);
    expect(component.currentIndex).toBe(1);
  });

  it("should not sort participants without sortParticipantsBy configured", fakeAsync(() => {
    participant1.name = "Zoey";
    participant2.name = "Adam";

    testParticipantsAreSorted(
      [participant1, participant2],
      [participant1, participant2],
      undefined,
    );
  }));

  it("should sort participants alphabetically for sortParticipantsBy", fakeAsync(() => {
    participant1.name = "Zoey";
    participant2.name = undefined;
    participant3.name = "Adam";

    testParticipantsAreSorted(
      [participant1, participant2, participant3],
      [participant3, participant1, participant2],
      "name",
    );
  }));

  it("should sort participants numerically for sortParticipantsBy", fakeAsync(() => {
    // @ts-ignore
    participant1.priority = 99;
    // @ts-ignore
    participant2.priority = 1;

    testParticipantsAreSorted(
      [participant1, participant2],
      [participant2, participant1],
      "priority",
    );
  }));

  function testParticipantsAreSorted(
    participantsInput: TestEntity[],
    expectedParticipantsOrder: TestEntity[],
    sortParticipantsBy: string,
  ) {
    const event = new Note();
    for (const p of participantsInput) {
      addParticipant(event, p);
    }
    component.eventEntity = event;
    component.ngOnChanges(dummyChanges);
    tick();

    component.sortParticipantsBy = sortParticipantsBy;
    component.ngOnChanges({
      sortParticipantsBy: new SimpleChange(undefined, "name", false),
    });
    tick();

    expect(component.participants).toEqual(expectedParticipantsOrder);
    expect(component.eventEntity.children).toEqual(
      expectedParticipantsOrder.map((p) => p.getId()),
    );
    expect(
      component.eventEntity.childrenAttendance.map((a) => a.participant),
    ).toEqual(expectedParticipantsOrder.map((p) => p.getId()));
    flush();
  }
});
