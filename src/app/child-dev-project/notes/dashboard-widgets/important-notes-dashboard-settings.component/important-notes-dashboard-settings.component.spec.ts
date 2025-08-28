import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImportantNotesDashboardSettingsComponent } from "./important-notes-dashboard-settings.component";
import { FormControl } from "@angular/forms";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("ImportantNotesDashboardSettingsComponent", () => {
  let component: ImportantNotesDashboardSettingsComponent;
  let fixture: ComponentFixture<ImportantNotesDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImportantNotesDashboardSettingsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportantNotesDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      warningLevels: [],
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
