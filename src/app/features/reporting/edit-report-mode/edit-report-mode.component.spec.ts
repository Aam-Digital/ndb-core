import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditReportModeComponent } from "./edit-report-mode.component";

describe("EditReportModeComponent", () => {
  let component: EditReportModeComponent;
  let fixture: ComponentFixture<EditReportModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReportModeComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReportModeComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "mode", {}, fixture);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("offers the supported report modes", () => {
    expect(component.modeOptions).toEqual(["reporting", "exporting", "sql"]);
  });
});
