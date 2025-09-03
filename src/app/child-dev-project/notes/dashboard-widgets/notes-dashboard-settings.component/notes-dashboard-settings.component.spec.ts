import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { NotesDashboardSettingsComponent } from "./notes-dashboard-settings.component";

describe("NotesDashboardSettingsComponent", () => {
  let component: NotesDashboardSettingsComponent;
  let fixture: ComponentFixture<NotesDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesDashboardSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      sinceDays: 28,
      fromBeginningOfWeek: false,
      mode: "with-recent-notes",
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
