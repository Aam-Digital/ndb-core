import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";

import { ImportantNotesDashboardComponent } from "./important-notes-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { Note } from "../../model/note";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { warningLevels } from "../../../warning-levels";

describe("ImportantNotesDashboardComponent", () => {
  let component: ImportantNotesDashboardComponent;
  let fixture: ComponentFixture<ImportantNotesDashboardComponent>;

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
      declarations: [ImportantNotesDashboardComponent],
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
    fixture = TestBed.createComponent(ImportantNotesDashboardComponent);
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
    expect(component.notesDataSource.data).toEqual(expectedNotes);
  }));
});
