import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoteAttendanceBlockComponent } from "./note-attendance-block.component";
import { Note } from "../model/note";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";

describe("NoteAttendanceBlockComponent", () => {
  let component: NoteAttendanceBlockComponent;
  let fixture: ComponentFixture<NoteAttendanceBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoteAttendanceBlockComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteAttendanceBlockComponent);
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

    component.onInitFromDynamicConfig({
      entity: note,
      id: "",
      config: { status: "PRESENT" },
    });

    expect(component.participantsWithStatus).toBe(2);
  });
});
