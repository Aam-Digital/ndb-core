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
import { ConfigService } from "../../../../core/config/config.service";
import { ConfigurableEnumConfig } from "../../../../core/configurable-enum/configurable-enum.interface";
import { Child } from "../../../children/model/child";
import { LoggingService } from "../../../../core/logging/logging.service";
import { defaultAttendanceStatusTypes } from "../../../../core/config/default-config/default-attendance-status-types";
import { AttendanceModule } from "../../attendance.module";
import { ChildrenService } from "../../../children/children.service";
import { MockSessionModule } from "../../../../core/session/mock-session.module";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { SimpleChange } from "@angular/core";

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  const testEvent = Note.create(new Date());
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  let participant1: Child, participant2: Child, participant3: Child;

  const dummyChanges = {
    eventEntity: new SimpleChange(undefined, {}, true),
  };

  beforeEach(
    waitForAsync(() => {
      participant1 = new Child("child1");
      participant2 = new Child("child2");
      participant3 = new Child("child3");

      mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfig",
      ]);
      mockConfigService.getConfig.and.returnValue([]);
      mockLoggingService = jasmine.createSpyObj(["warn"]);

      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          MockSessionModule.withState(LoginState.LOGGED_IN, [
            participant1,
            participant2,
            participant3,
          ]),
          FontAwesomeTestingModule,
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: ChildrenService, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    component.eventEntity = testEvent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available attendance status to select", async () => {
    const testStatusEnumConfig: ConfigurableEnumConfig = [
      {
        id: "PRESENT",
        shortName: "P",
        label: "Present",
        style: "attendance-P",
        countAs: "PRESENT",
      },
      {
        id: "ABSENT",
        shortName: "A",
        label: "Absent",
        style: "attendance-A",
        countAs: "ABSENT",
      },
    ];
    mockConfigService.getConfig.and.returnValue(testStatusEnumConfig);
    component.eventEntity = new Note();
    component.eventEntity.addChild(participant1.getId());
    await component.ngOnChanges(dummyChanges);
    fixture.detectChanges();
    await fixture.whenStable();

    const statusOptions = fixture.debugElement.queryAll(
      By.css(".group-select-option")
    );
    expect(statusOptions.length).toBe(testStatusEnumConfig.length);
  });

  it("should not record attendance if childId does not exist", fakeAsync(() => {
    const nonExistingChildId = "notExistingChild";
    const noteWithNonExistingChild = new Note();
    noteWithNonExistingChild.addChild(participant1.getId());
    noteWithNonExistingChild.addChild(nonExistingChildId);
    component.eventEntity = noteWithNonExistingChild;

    component.ngOnChanges(dummyChanges);
    tick();

    expect(component.entries.map((e) => e.child)).toEqual([participant1]);
    expect(component.eventEntity.children).not.toContain(nonExistingChildId);
    expect(mockLoggingService.warn).toHaveBeenCalled();
    flush();
  }));

  it("should correctly assign the attendance", fakeAsync(() => {
    const attendedStatus = defaultAttendanceStatusTypes.find(
      (it) => it.countAs === "PRESENT"
    );
    const absentStatus = defaultAttendanceStatusTypes.find(
      (it) => it.countAs === "ABSENT"
    );
    const note = new Note("noteWithAttendance");
    note.addChild(participant1.getId());
    note.addChild(participant2.getId());

    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    const attendedChildAttendance = component.entries.find(
      ({ child }) => child === participant1
    ).attendance;
    const absentChildAttendance = component.entries.find(
      ({ child }) => child === participant2
    ).attendance;
    component.markAttendance(attendedChildAttendance, attendedStatus);
    component.markAttendance(absentChildAttendance, absentStatus);

    expect(note.getAttendance(participant1.getId()).status).toEqual(
      attendedStatus
    );
    expect(note.getAttendance(participant2.getId()).status).toEqual(
      absentStatus
    );
    flush();
  }));

  it("should mark roll call as done when all existing children are finished", fakeAsync(() => {
    const note = new Note();
    note.addChild(participant1.getId());
    note.addChild("notExistingChild");
    note.addChild(participant2.getId());

    spyOn(component.complete, "emit");
    component.eventEntity = note;
    component.ngOnChanges(dummyChanges);
    tick();

    component.goToNextParticipant();
    component.goToNextParticipant();

    expect(component.complete.emit).toHaveBeenCalledWith(note);
  }));

  it("should only complete when clicking save and confirming in the dialog when roll call is not finished yet", fakeAsync(() => {
    const note = new Note();
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    // Set component to be not finished
    component.currentIndex = 0;
    component.entries = [undefined, undefined];
    spyOn(component.complete, "emit");
    component.eventEntity = note;
    spyOn(confirmationDialogService, "openDialog").and.returnValue({
      afterClosed: () => of(true),
    } as any);

    component.save();
    tick();

    expect(component.complete.emit).toHaveBeenCalledWith(note);
  }));

  it("should directly complete when clicking save and the roll call finished", () => {
    const note = new Note();
    component.eventEntity = note;
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialogService, "openDialog");
    spyOn(component, "isFinished").and.returnValue(true);
    spyOn(component.complete, "emit");

    component.save();

    expect(confirmationDialogService.openDialog).not.toHaveBeenCalled();
    expect(component.complete.emit).toHaveBeenCalledWith(note);
  });

  it("should not open the dialog when the roll call is finished", () => {
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialogService, "openDialog");
    spyOn(component, "isFinished").and.returnValue(true);

    component.abort();

    expect(confirmationDialogService.openDialog).not.toHaveBeenCalled();
  });

  it("should open the dialog when the roll call is not finished", () => {
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialogService, "openDialog").and.returnValue({
      afterClosed: () => of(true),
    } as any);
    spyOn(component, "isFinished").and.returnValue(false);

    component.abort();

    expect(confirmationDialogService.openDialog).toHaveBeenCalled();
  });

  it("should not sort participants without sortParticipantsBy configured", fakeAsync(() => {
    participant1.name = "Zoey";
    participant2.name = "Adam";

    testParticipantsAreSorted(
      [participant1, participant2],
      [participant1, participant2],
      undefined
    );
  }));

  it("should sort participants alphabetically for sortParticipantsBy", fakeAsync(() => {
    participant1.name = "Zoey";
    participant2.name = undefined;
    participant3.name = "Adam";

    testParticipantsAreSorted(
      [participant1, participant2, participant3],
      [participant3, participant1, participant2],
      "name"
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
      "priority"
    );
  }));

  function testParticipantsAreSorted(
    participantsInput: Child[],
    expectedParticipantsOrder: Child[],
    sortParticipantsBy: string
  ) {
    const event = new Note();
    for (const p of participantsInput) {
      event.addChild(p.getId());
    }
    component.eventEntity = event;
    component.ngOnChanges(dummyChanges);
    tick();

    component.sortParticipantsBy = sortParticipantsBy;
    component.ngOnChanges({
      sortParticipantsBy: new SimpleChange(undefined, "name", false),
    });
    tick();

    expect(component.entries.map((e) => e.child)).toEqual(
      expectedParticipantsOrder
    );
    expect(component.eventEntity.children).toEqual(
      expectedParticipantsOrder.map((p) => p.getId())
    );
    flush();
  }
});
