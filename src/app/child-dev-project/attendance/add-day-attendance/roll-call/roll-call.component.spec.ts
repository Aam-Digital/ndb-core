import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { RollCallComponent } from "./roll-call.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../../notes/model/note";
import { By } from "@angular/platform-browser";
import { ConfigService } from "../../../../core/config/config.service";
import { ConfigurableEnumConfig } from "../../../../core/configurable-enum/configurable-enum.interface";
import { Child } from "../../../children/model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { LoggingService } from "../../../../core/logging/logging.service";
import { defaultAttendanceStatusTypes } from "../../../../core/config/default-config/default-attendance-status-types";
import { AttendanceModule } from "../../attendance.module";
import { ChildrenService } from "../../../children/children.service";

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  const testEvent = Note.create(new Date());
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(
    waitForAsync(() => {
      mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfig",
      ]);
      mockConfigService.getConfig.and.returnValue([]);
      mockEntityMapper = jasmine.createSpyObj(["load"]);
      mockEntityMapper.load.and.resolveTo();
      mockLoggingService = jasmine.createSpyObj(["warn"]);

      TestBed.configureTestingModule({
        imports: [AttendanceModule, NoopAnimationsModule],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
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
    component.eventEntity = Note.create(new Date());
    component.eventEntity.addChild("1");
    await component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    const statusOptions = fixture.debugElement.queryAll(
      By.css(".group-select-option")
    );
    expect(statusOptions.length).toBe(testStatusEnumConfig.length);
  });

  it("should not record attendance if childId does not exist", fakeAsync(() => {
    const existingChild = new Child("existingChild");
    const noteWithNonExistingChild = new Note();
    noteWithNonExistingChild.addChild(existingChild.getId());
    noteWithNonExistingChild.addChild("notExistingChild");
    component.eventEntity = noteWithNonExistingChild;

    mockEntityMapper.load.and.callFake((con, id) =>
      id === existingChild.getId()
        ? Promise.resolve(existingChild as any)
        : Promise.reject()
    );

    component.ngOnInit();
    tick();

    expect(component.entries.map((e) => e.child)).toEqual([existingChild]);
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
    const attendedChild = new Child("attendedChild");
    const absentChild = new Child("absentChild");
    const note = new Note("noteWithAttendance");
    note.addChild(attendedChild.getId());
    note.addChild(absentChild.getId());
    mockEntityMapper.load.and.callFake((t, id) => {
      if (id === absentChild.getId()) {
        return Promise.resolve(absentChild) as any;
      }
      if (id === attendedChild.getId()) {
        return Promise.resolve(attendedChild) as any;
      }
    });
    component.eventEntity = note;
    component.ngOnInit();
    tick();

    const attendedChildAttendance = component.entries.find(
      ({ child }) => child === attendedChild
    ).attendance;
    const absentChildAttendance = component.entries.find(
      ({ child }) => child === absentChild
    ).attendance;
    component.markAttendance(attendedChildAttendance, attendedStatus);
    component.markAttendance(absentChildAttendance, absentStatus);

    expect(note.getAttendance(attendedChild.getId()).status).toEqual(
      attendedStatus
    );
    expect(note.getAttendance(absentChild.getId()).status).toEqual(
      absentStatus
    );
    flush();
  }));

  it("should mark roll call as done when all existing children are finished", fakeAsync(() => {
    const existingChild1 = new Child("existingChild1");
    const existingChild2 = new Child("existingChild2");
    const note = new Note();
    note.addChild(existingChild1.getId());
    note.addChild("notExistingChild");
    note.addChild(existingChild2.getId());
    mockEntityMapper.load.and.returnValues(
      Promise.resolve(existingChild2),
      Promise.reject(),
      Promise.resolve(existingChild1)
    );
    spyOn(component.completed, "emit");
    component.eventEntity = note;
    component.ngOnInit();
    tick();

    component.goToNextParticipant();
    component.goToNextParticipant();

    expect(component.completed.emit).toHaveBeenCalledWith(note);
  }));
});
