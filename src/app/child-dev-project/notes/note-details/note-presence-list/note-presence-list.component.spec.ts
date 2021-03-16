import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { NotePresenceListComponent } from "./note-presence-list.component";
import { Note } from "../../model/note";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { ChildSelectComponent } from "../../../children/child-select/child-select.component";
import { ChildrenService } from "../../../children/children.service";
import { ChildMeetingNoteAttendanceComponent } from "../child-meeting-attendance/child-meeting-note-attendance.component";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { SchoolBlockComponent } from "../../../schools/school-block/school-block.component";
import { of } from "rxjs";
import { Child } from "../../../children/model/child";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";

describe("NotePresenceListComponent", () => {
  let component: NotePresenceListComponent;
  let fixture: ComponentFixture<NotePresenceListComponent>;

  let testEntity: Note;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(
    waitForAsync(() => {
      testEntity = new Note("test1");

      mockChildrenService = jasmine.createSpyObj(["getChild", "getChildren"]);
      mockChildrenService.getChildren.and.returnValue(of([]));
      mockChildrenService.getChild.and.returnValue(of(new Child("")));

      TestBed.configureTestingModule({
        declarations: [
          NotePresenceListComponent,
          ChildMeetingNoteAttendanceComponent,
          ChildSelectComponent,
          ChildBlockComponent,
          SchoolBlockComponent,
        ],
        imports: [
          FormsModule,
          MatFormFieldModule,
          MatInputModule,
          MatIconModule,
          MatButtonModule,
          MatButtonToggleModule,
          MatAutocompleteModule,
          NoopAnimationsModule,
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePresenceListComponent);
    component = fixture.componentInstance;

    component.entity = testEntity;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
