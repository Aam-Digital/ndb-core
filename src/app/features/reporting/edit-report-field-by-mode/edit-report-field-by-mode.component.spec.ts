import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup } from "@angular/forms";
import { NgControl } from "@angular/forms";
import { EditReportFieldByModeComponent } from "./edit-report-field-by-mode.component";

/**
 * Build the component wired to a form group holding a sibling `mode` control and the
 * field's own control, plus a `formFieldConfig` declaring the modes the field applies to.
 */
function createComponent(
  applicableModes: string[],
  mode: string | undefined,
): {
  fixture: ComponentFixture<EditReportFieldByModeComponent>;
  component: EditReportFieldByModeComponent;
  formGroup: FormGroup;
} {
  const formGroup = new FormGroup({
    mode: new FormControl(mode),
    reportDefinition: new FormControl<object>({}),
  });
  const fixture = TestBed.createComponent(EditReportFieldByModeComponent);
  const component = fixture.componentInstance;
  component.ngControl = {
    control: formGroup.get("reportDefinition"),
  } as NgControl;
  fixture.componentRef.setInput("formFieldConfig", {
    id: "reportDefinition",
    additional: { modes: applicableModes },
  });
  fixture.detectChanges();
  return { fixture, component, formGroup };
}

describe("EditReportFieldByModeComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReportFieldByModeComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it("shows the editor when the current mode is applicable", () => {
    const { fixture, component } = createComponent(["sql"], "sql");

    expect(component.applies()).toBe(true);
    expect(fixture.nativeElement.querySelector("app-json-editor")).toBeTruthy();
  });

  it("hides the editor and shows a note when the current mode is not applicable", () => {
    const { fixture, component } = createComponent(["sql"], "reporting");

    expect(component.applies()).toBe(false);
    expect(fixture.nativeElement.querySelector("app-json-editor")).toBeFalsy();
  });
});
