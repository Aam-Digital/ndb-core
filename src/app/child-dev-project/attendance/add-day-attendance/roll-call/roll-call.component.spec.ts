import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { RollCallComponent } from "./roll-call.component";
import { Note } from "../../../notes/model/note";
import { By } from "@angular/platform-browser";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { SimpleChange } from "@angular/core";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { ChildrenService } from "../../../children/children.service";
import { ConfigurableEnumService } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

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
      providers: [{ provide: ChildrenService, useValue: {} }],
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
    component.eventEntity.addChild(participant1);
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
    noteWithNonExistingChild.addChild(participant1);
    noteWithNonExistingChild.addChild(nonExistingChildId);
    component.eventEntity = noteWithNonExistingChild;

    component.ngOnChanges(dummyChanges);
    tick();

    expect(component.children).toEqual([participant1]);
    expect(component.eventEntity.children).not.toContain(nonExistingChildId);
    flush();
  }));

  it("should correctly assign the attendance", fakeAsync(() => {
    const note = new Note("noteWithAttendance");
    note.addChild(participant1);
    note.addChild(participant2);

    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    component.markAttendance(PRESENT);
    tick(1000);
    component.markAttendance(ABSENT);

    expect(note.getAttendance(participant1).status).toEqual(PRESENT);
    expect(note.getAttendance(participant2).status).toEqual(ABSENT);
    flush();
  }));

  it("should mark roll call as done when all existing children are finished", fakeAsync(() => {
    const note = new Note();
    note.addChild(participant1);
    note.addChild("notExistingChild");
    note.addChild(participant2);

    spyOn(component.complete, "emit");
    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    component.goToNext();
    component.goToNext();

    expect(component.complete.emit).toHaveBeenCalledWith(note);
  }));

  it("should not open the dialog when the roll call is finished", () => {
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialogService, "getConfirmation");
    spyOnProperty(component, "isFinished").and.returnValue(true);

    component.finish();

    expect(confirmationDialogService.getConfirmation).not.toHaveBeenCalled();
  });

  it("isn't dirty initially", () => {
    expect(component.isDirty).toBeFalse();
  });

  it("isn't dirty when the user has skipped participants", async () => {
    component.eventEntity = Note.create(new Date(), "test", [
      participant1.getId(),
      participant2.getId(),
    ]);
    await component.ngOnChanges(dummyChanges);

    component.goToNext();
    component.goToNext();
    component.goToPrevious();
    expect(component.isDirty).toBeFalse();
  });

  it("is dirty when the user has entered some attendance", async () => {
    component.eventEntity = Note.create(new Date(), "test", [
      participant1.getId(),
    ]);
    await component.ngOnChanges(dummyChanges);

    component.markAttendance(undefined);
    expect(component.isDirty).toBeTrue();
  });

  it("starts with the initial child if no attendance has been registered", async () => {
    component.eventEntity.addChild(participant1);
    await component.ngOnChanges(dummyChanges);

    expect(component.currentIndex).toBe(0);
    expect(component.currentChild).toBe(participant1);
  });

  it("starts with the first child that doesn't have an attendance status set", async () => {
    for (const child of [participant1, participant2, participant3]) {
      component.eventEntity.addChild(child);
    }
    component.eventEntity.getAttendance(participant1).status = PRESENT;
    component.eventEntity.getAttendance(participant3).status = ABSENT;
    await component.ngOnChanges(dummyChanges);
    expect(component.currentChild).toBe(participant2);
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
      event.addChild(p);
    }
    component.eventEntity = event;
    component.ngOnChanges(dummyChanges);
    tick();

    component.sortParticipantsBy = sortParticipantsBy;
    component.ngOnChanges({
      sortParticipantsBy: new SimpleChange(undefined, "name", false),
    });
    tick();

    expect(component.children).toEqual(expectedParticipantsOrder);
    expect(component.eventEntity.children).toEqual(
      expectedParticipantsOrder.map((p) => p.getId()),
    );
    flush();
  }
});
