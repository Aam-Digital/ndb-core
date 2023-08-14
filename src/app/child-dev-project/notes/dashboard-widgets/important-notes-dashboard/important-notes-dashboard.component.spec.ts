import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ImportantNotesDashboardComponent } from "./important-notes-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { Note } from "../../model/note";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { warningLevels } from "../../../warning-levels";
import { of } from "rxjs";
import { map } from "rxjs/operators";

describe("ImportantNotesDashboardComponent", () => {
  let component: ImportantNotesDashboardComponent;
  let fixture: ComponentFixture<ImportantNotesDashboardComponent>;

  const mockNotes = warningLevels.map((wLevel) => {
    const note = Note.create(new Date());
    note.warningLevel = wLevel;
    return note;
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MockedTestingModule.withState(LoginState.LOGGED_IN, mockNotes),
        ImportantNotesDashboardComponent,
      ],
      providers: [
        {
          provide: FormDialogService,
          useValue: {
            openDialog: () => {},
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportantNotesDashboardComponent);
    component = fixture.componentInstance;
    component.warningLevels = ["WARNING", "URGENT"];
    fixture.detectChanges();
    return fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows notes that have a high warning level", fakeAsync(() => {
    const expectedNotes = mockNotes
      .filter((note) => ["WARNING", "URGENT"].includes(note.warningLevel.id))
      .reverse();

    let actualNotes;
    of(mockNotes)
      .pipe(map((d) => component.dataMapper(d)))
      .subscribe((data) => (actualNotes = data));
    tick();
    expect(actualNotes).toEqual(expectedNotes);
  }));
});
