import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";

import { ImportantNotesComponent } from "./important-notes.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { Note } from "../../model/note";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { MatPaginatorModule } from "@angular/material/paginator";
import { warningLevels } from "../../../warning-levels";

describe("ImportantNotesComponent", () => {
  let component: ImportantNotesComponent;
  let fixture: ComponentFixture<ImportantNotesComponent>;

  const mockNotes = warningLevels.map((wLevel) => {
    const note = Note.create(new Date());
    note.warningLevel = wLevel;
    return note;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockedTestingModule.withState(LoginState.LOGGED_IN, mockNotes),
        MatPaginatorModule,
      ],
      declarations: [ImportantNotesComponent],
      providers: [
        {
          provide: FormDialogService,
          useValue: {
            openDialog: () => {},
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ImportantNotesComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({
      warningLevels: ["WARNING", "URGENT"],
    });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows notes that have a high warning level", fakeAsync(() => {
    const expectedNotes = mockNotes
      .filter((note) => ["WARNING", "URGENT"].includes(note.warningLevel.id))
      .reverse();
    expect(component.relevantNotes).toEqual(expectedNotes);
  }));
});
