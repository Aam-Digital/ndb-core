import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportantNotesComponent } from "./important-notes.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { Note } from "../../model/note";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { MatPaginatorModule } from "@angular/material/paginator";

describe("ImportantNotesComponent", () => {
  let component: ImportantNotesComponent;
  let fixture: ComponentFixture<ImportantNotesComponent>;

  function createNote(wLevel: string) {
    const note = Note.create(new Date());
    note.warningLevel = {
      id: wLevel,
      label: "",
    };
    return note;
  }

  const mockNotes = ["WARNING", "WARNING", "URGENT", "OK", ""].map(createNote);

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

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportantNotesComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({
      warningLevels: ["WARNING", "URGENT"],
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows notes that have a high warning level", () => {
    const expectedNotes = mockNotes.filter(
      (note) => note.warningLevel.id in ["WARNING", "URGENT"]
    );
    expect(component.relevantNotes).toEqual(expectedNotes);
  });
});
