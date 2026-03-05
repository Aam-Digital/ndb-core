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
import { EventWithAttendance } from "../../model/event-with-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { AttendanceItem } from "../../model/attendance-item";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Location } from "@angular/common";
import { AttendanceService } from "../../attendance.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { mockEntityMapperProvider } from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import {
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";

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

  let mockEnumService: jasmine.SpyObj<ConfigurableEnumService>;

  function addParticipant(note: Note, participant: Entity | string) {
    const id =
      typeof participant === "string" ? participant : participant.getId();
    note.children.push(id);
    note.childrenAttendance.push(new AttendanceItem(undefined, "", id));
  }

  function stabilize() {
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      tick(); // microtasks (Promises from resource loader, etc.)
      TestBed.tick(); // flush Angular effects and change detection
    }
  }

  beforeEach(waitForAsync(() => {
    participant1 = new TestEntity("child1");
    participant2 = new TestEntity("child2");
    participant3 = new TestEntity("child3");

    mockEnumService = jasmine.createSpyObj("ConfigurableEnumService", {
      getEnumValues: [],
    });

    TestBed.configureTestingModule({
      imports: [
        RollCallComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        ...mockEntityMapperProvider([participant1, participant2, participant3]),
        { provide: EntityRegistry, useValue: entityRegistry },
        EntitySchemaService,
        { provide: ConfigurableEnumService, useValue: mockEnumService },
        {
          provide: FormDialogService,
          useValue: jasmine.createSpyObj("FormDialogService", ["openView"]),
        },
        {
          provide: ConfirmationDialogService,
          useValue: jasmine.createSpyObj("ConfirmationDialogService", [
            "getConfirmation",
            "getDiscardConfirmation",
          ]),
        },
        { provide: UnsavedChangesService, useValue: { pending: false } },
        {
          provide: AttendanceService,
          useValue: {
            createEventForActivity: () =>
              Promise.resolve(
                new EventWithAttendance(
                  new Note(),
                  "childrenAttendance",
                  "date",
                ),
              ),
            getEventsOnDate: () => Promise.resolve([]),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(Note.create(new Date())),
    );
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available attendance status to select", fakeAsync(() => {
    const options = [PRESENT, ABSENT];
    mockEnumService.getEnumValues.and.returnValue(options);
    const event = Note.create(new Date());
    addParticipant(event, participant1);
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(event),
    );
    stabilize();

    expect(component.availableStatus()).toHaveSize(options.length);
    flush();
  }));

  it("should not record attendance if childId does not exist", fakeAsync(() => {
    const nonExistingChildId = "TestEntity:notExistingChild";
    const noteWithNonExistingChild = new Note();
    addParticipant(noteWithNonExistingChild, participant1);
    addParticipant(noteWithNonExistingChild, nonExistingChildId);

    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(noteWithNonExistingChild),
    );
    stabilize();

    expect(component.participants()).toEqual([participant1]);
    const note = component.event()?.entity as Note;
    expect(
      note.childrenAttendance.some((a) => a.participant === nonExistingChildId),
    ).toBeFalse();
    flush();
  }));

  it("should correctly assign the attendance", fakeAsync(() => {
    const note = new Note("noteWithAttendance");
    addParticipant(note, participant1);
    addParticipant(note, participant2);

    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(note),
    );
    stabilize();

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
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(note),
    );
    stabilize();

    component.goToParticipantWithIndex(component.currentIndex() + 1);
    component.goToParticipantWithIndex(component.currentIndex() + 1);

    expect(saveSpy).toHaveBeenCalledWith(note);
  }));

  it("should navigate back to overview when finish is called", () => {
    const location = TestBed.inject(Location);
    spyOn(location, "back");

    component.finish();

    expect(location.back).toHaveBeenCalled();
  });

  it("isn't dirty initially", () => {
    expect(component.isDirty()).toBeFalse();
  });

  it("isn't dirty when the user has skipped participants", fakeAsync(() => {
    const event = new Note();
    addParticipant(event, participant1.getId());
    addParticipant(event, participant2.getId());
    event.date = new Date();
    event.subject = "test";
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(event),
    );
    stabilize();

    component.goToParticipantWithIndex(component.currentIndex() + 1);
    component.goToParticipantWithIndex(component.currentIndex() + 1);
    component.goToParticipantWithIndex(component.currentIndex() - 1);
    expect(component.isDirty()).toBeFalse();
    flush();
  }));

  it("is dirty when the user has entered some attendance", fakeAsync(() => {
    const event = new Note();
    addParticipant(event, participant1.getId());
    event.date = new Date();
    event.subject = "test";
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(event),
    );
    stabilize();

    component.markAttendance(undefined);
    expect(component.isDirty()).toBeTrue();
    flush();
  }));

  it("starts with the initial child if no attendance has been registered", fakeAsync(() => {
    const event = Note.create(new Date());
    addParticipant(event, participant1);
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(event),
    );
    stabilize();

    expect(component.currentIndex()).toBe(0);
    expect(component.currentParticipant()).toBe(participant1);
    flush();
  }));

  it("starts with the first child that doesn't have an attendance status set", fakeAsync(() => {
    const note = Note.create(new Date());
    for (const child of [participant1, participant2, participant3]) {
      addParticipant(note, child);
    }
    note.childrenAttendance.find(
      (a) => a.participant === participant1.getId(),
    ).status = PRESENT;
    note.childrenAttendance.find(
      (a) => a.participant === participant3.getId(),
    ).status = ABSENT;
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(note),
    );
    stabilize();

    expect(component.currentParticipant()).toBe(participant2);
    expect(component.currentIndex()).toBe(1);
    flush();
  }));

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
    fixture.componentRef.setInput(
      "eventEntity",
      AttendanceService.createEventFromEntity(event),
    );
    stabilize();

    fixture.componentRef.setInput("sortParticipantsBy", sortParticipantsBy);
    stabilize();

    expect(component.participants()).toEqual(expectedParticipantsOrder);
    expect(event.childrenAttendance.map((a) => a.participant)).toEqual(
      expectedParticipantsOrder.map((p) => p.getId()),
    );
    flush();
  }
});
