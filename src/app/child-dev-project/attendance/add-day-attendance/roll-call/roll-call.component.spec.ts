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
import { Child } from "../../../children/model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { LoggingService } from "../../../../core/logging/logging.service";
import { AttendanceModule } from "../../attendance.module";
import { MockSessionModule } from "../../../../core/session/mock-session.module";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { EventAttendance } from "../../model/event-attendance";
import { ChildrenService } from "../../../children/children.service";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";

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

const mockChildren = ["test1", "test2", "c", "d"].map(Child.create);

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(
    waitForAsync(() => {
      mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfigurableEnumValues",
      ]);
      mockConfigService.getConfigurableEnumValues.and.returnValue([]);
      mockLoggingService = jasmine.createSpyObj(["warn"]);

      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          MockSessionModule,
          FontAwesomeTestingModule,
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper(mockChildren),
          },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: ChildrenService, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    component.eventEntity = Note.create(new Date());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available attendance status to select", async () => {
    const options = [PRESENT, ABSENT];
    mockConfigService.getConfigurableEnumValues.and.returnValue(options);
    component.eventEntity.addChild(mockChildren[0]);
    await component.ngOnInit();
    fixture.detectChanges();

    const statusOptions = fixture.debugElement.queryAll(
      By.css(".group-select-option")
    );
    expect(statusOptions).toHaveSize(options.length);
  });

  it("should not record attendance if childId does not exist", fakeAsync(() => {
    const noteWithNonExistingChild = new Note();
    noteWithNonExistingChild.addChild(mockChildren[0]);
    noteWithNonExistingChild.addChild("notExistingChild");
    component.eventEntity = noteWithNonExistingChild;

    component.ngOnInit();
    tick();

    expect(component.entries.map((e) => e.child)).toEqual([mockChildren[0]]);
    expect(mockLoggingService.warn).toHaveBeenCalled();
    flush();
  }));

  it("should correctly assign the attendance", fakeAsync(() => {
    component.eventEntity.addChild(mockChildren[0]);
    component.eventEntity.addChild(mockChildren[1]);
    component.ngOnInit();
    tick();
    component.markAttendance(PRESENT);
    component.goToNext();
    component.markAttendance(ABSENT);

    expect(component.eventEntity.getAttendance(mockChildren[0]).status).toEqual(
      PRESENT
    );
    expect(component.eventEntity.getAttendance(mockChildren[1]).status).toEqual(
      ABSENT
    );
    flush();
  }));

  it("should mark roll call as done when all existing children are finished", async () => {
    spyOn(component.complete, "emit");
    component.eventEntity.addChild(mockChildren[0]);
    component.eventEntity.addChild("notExistingChild");
    component.eventEntity.addChild(mockChildren[1]);
    await component.ngOnInit();

    component.goToNext();
    component.goToNext();

    expect(component.complete.emit).toHaveBeenCalledWith(component.eventEntity);
  });

  it("should not open the dialog when the roll call is finished", () => {
    const confirmationDialogService = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialogService, "openDialog");
    spyOnProperty(component, "isFinished").and.returnValue(true);

    component.finish();

    expect(confirmationDialogService.openDialog).not.toHaveBeenCalled();
  });

  it("isn't dirty initially", () => {
    expect(component.isDirty).toBeFalse();
  });

  it("isn't dirty when the user has skipped participants", () => {
    component.goToNext();
    component.goToNext();
    component.goToPrevious();
    expect(component.isDirty).toBeFalse();
  });

  it("is dirty when the user has entered some attendance", async () => {
    component.entries = [
      {
        child: mockChildren[0],
        attendance: new EventAttendance(),
      },
    ];
    component.markAttendance(undefined);
    expect(component.isDirty).toBeTrue();
  });

  it("starts with the initial child if no attendance has been registered", async () => {
    component.eventEntity.addChild(mockChildren[0]);
    await component.ngOnInit();
    expect(component.currentIndex).toBe(0);
    expect(component.currentChild).toBe(mockChildren[0]);
  });

  it("starts with the first child that doesn't have an attendance status set", async () => {
    for (const child of mockChildren) {
      component.eventEntity.addChild(child);
    }
    component.eventEntity.getAttendance(mockChildren[0]).status = PRESENT;
    component.eventEntity.getAttendance(mockChildren[1]).status = ABSENT;
    component.eventEntity.getAttendance(mockChildren[3]).status = PRESENT;
    await component.ngOnInit();
    expect(component.currentChild).toBe(mockChildren[2]);
    expect(component.currentIndex).toBe(2);
  });
});
