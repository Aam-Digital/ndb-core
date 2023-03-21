import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoteAttendanceCountBlockComponent } from "./note-attendance-count-block.component";
import { Note } from "../model/note";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "../../attendance/model/attendance-status";

describe("NoteAttendanceBlockCountComponent", () => {
  let component: NoteAttendanceCountBlockComponent;
  let fixture: ComponentFixture<NoteAttendanceCountBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteAttendanceCountBlockComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteAttendanceCountBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should count the present children", () => {
    const present = defaultAttendanceStatusTypes.find(
      (status) => status.id === "PRESENT"
    );
    const absent = defaultAttendanceStatusTypes.find(
      (status) => status.id === "ABSENT"
    );
    const note = new Note();
    note.addChild("presentChild");
    note.getAttendance("presentChild").status = present;
    note.addChild("absentChild");
    note.getAttendance("absentChild").status = absent;
    note.addChild("anotherPresentChild");
    note.getAttendance("anotherPresentChild").status = present;

    component.entity = note;
    component.config = { status: AttendanceLogicalStatus.PRESENT };
    component.ngOnChanges();
    expect(component.participantsWithStatus).toBe(2);
  });
});
