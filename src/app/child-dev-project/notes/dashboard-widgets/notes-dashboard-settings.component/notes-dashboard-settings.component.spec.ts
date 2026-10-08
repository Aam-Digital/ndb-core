import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import {
  NotesDashboardSettingsComponent,
  NotesDashboardSettingsConfig,
} from "./notes-dashboard-settings.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("NotesDashboardSettingsComponent", () => {
  let fixture: ComponentFixture<NotesDashboardSettingsComponent>;
  let formControl: FormControl<NotesDashboardSettingsConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotesDashboardSettingsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesDashboardSettingsComponent);
  });

  function init(config: NotesDashboardSettingsConfig) {
    formControl = new FormControl(config);
    fixture.componentRef.setInput("formControl", formControl);
    fixture.detectChanges();
  }

  it("should require an entity type to be selected", () => {
    init({ sinceDays: 28 });
    expect(formControl.invalid).toBe(true);

    fixture.componentInstance.onEntityTypeChange("Child");
    fixture.detectChanges();

    expect(formControl.valid).toBe(true);
    expect(formControl.value.entityType).toBe("Child");
  });

  it("should be valid for a config with an entity type", () => {
    init({ entityType: "School" });
    expect(formControl.valid).toBe(true);
  });
});
